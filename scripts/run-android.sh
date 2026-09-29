#!/usr/bin/env bash
# Start GopherFit on the Windows-hosted Android emulator from WSL, skipping steps that are
# already done: emulator -> Metro -> build -> boot wait -> install -> IPv4 bridge -> launch -> check.
#
#   scripts/run-android.sh         start (safe to re-run)
#   scripts/run-android.sh stop    stop app, emulator, Metro, forwarder and Gradle daemons
#
# Why each piece exists is explained in docs/ANDROID_SETUP.md.
set -euo pipefail

APP_ID=com.umnadc.gopherfit
ACTIVITY=.MainActivity
AVD=${AVD:-GopherFit_API36}
ARCH=${ARCH:-x86_64}             # emulator ABI; building only this one is much faster
METRO_PORT=${METRO_PORT:-8082}   # Metro binds IPv6 '::', which the emulator cannot reach...
BUNDLER_PORT=8081                # ...so socat serves the APK's port 8081 over IPv4
WIN_SDK=${WIN_SDK:-/mnt/c/Users/nengs/AppData/Local/Android/Sdk}
STATE=${STATE:-/tmp/gopher-android}   # logs, pid files, screenshot
export JAVA_HOME=${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}
export ANDROID_HOME=${ANDROID_HOME:-$HOME/Android/Sdk}
export PATH=$JAVA_HOME/bin:$PATH

ROOT=$(cd "$(dirname "$0")/.." && pwd)
APK=$ROOT/android/app/build/outputs/apk/debug/app-debug.apk
SERIAL=""
INSTALLED=0
LAUNCHED=0
mkdir -p "$STATE"

log() { printf '\n==> %s\n' "$*"; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
a() { adb -s "$SERIAL" "$@"; }

# Serial (emulator-5554, ...) of the running emulator for $AVD, or nothing.
find_serial() {
  local s
  for s in $(timeout 20 adb devices 2>/dev/null | tr -d '\r' | awk '/^emulator-/{print $1}'); do
    if [ "$(timeout 10 adb -s "$s" emu avd name 2>/dev/null | tr -d '\r' | head -n1)" = "$AVD" ]; then
      echo "$s"
      return 0
    fi
  done
  return 0
}

preflight() {
  command -v socat >/dev/null || die "socat missing: sudo apt-get install -y socat"
  [ -x "$JAVA_HOME/bin/java" ] || die "JDK 17 not found at $JAVA_HOME: sudo apt-get install -y openjdk-17-jdk-headless"
  [ -d "$ANDROID_HOME/platforms/android-36" ] || die "Linux Android SDK not found at $ANDROID_HOME"
  [ -x "$WIN_SDK/emulator/emulator.exe" ] || die "Windows emulator not found under $WIN_SDK"
  [[ $(adb version 2>/dev/null | tr -d '\r') == *"Running on Windows"* ]] ||
    die "'adb' must be the /usr/local/bin/adb wrapper around the Windows adb.exe"
  [ -d "$ROOT/node_modules" ] || die "node_modules missing: run 'npm ci' in $ROOT"
}

start_emulator() {
  SERIAL=$(find_serial)
  if [ -n "$SERIAL" ]; then
    log "Emulator $AVD already running as $SERIAL (skip)"
    return
  fi
  local avds exe
  avds=$("$WIN_SDK/emulator/emulator.exe" -list-avds 2>/dev/null | tr -d '\r')
  [[ $'\n'$avds$'\n' == *$'\n'"$AVD"$'\n'* ]] || die "AVD $AVD does not exist. Existing AVDs: $avds"
  log "Starting emulator $AVD on Windows"
  exe=$(wslpath -w "$WIN_SDK/emulator/emulator.exe")
  (cd /mnt/c && powershell.exe -NoProfile -Command \
    "Start-Process -FilePath '$exe' -ArgumentList '-avd','$AVD','-no-boot-anim'") >/dev/null
}

metro_up() {
  [[ $(curl -fs -m 3 "http://127.0.0.1:$METRO_PORT/status" 2>/dev/null) == *packager-status:running* ]]
}

start_metro() {
  if metro_up; then
    log "Metro already running on :$METRO_PORT (skip)"
    return
  fi
  log "Starting Metro on :$METRO_PORT (log: $STATE/metro.log)"
  # exec: no bash subshell may linger holding the caller's stdout while Metro runs.
  (cd "$ROOT" && exec setsid nohup npx expo start --port "$METRO_PORT" >"$STATE/metro.log" 2>&1 </dev/null) &
  echo $! >"$STATE/metro.pid"
  for _ in $(seq 60); do metro_up && return; sleep 2; done
  die "Metro did not start; see $STATE/metro.log"
}

ensure_native_project() {
  [ -x "$ROOT/android/gradlew" ] && return
  log "android/ is missing: running expo prebuild"
  # Prebuild rewrites the android/ios npm scripts to "expo run:*"; keep package.json unchanged.
  cp "$ROOT/package.json" "$STATE/package.json.bak"
  if ! (cd "$ROOT" && CI=1 npx expo prebuild --platform android --no-install); then
    cp "$STATE/package.json.bak" "$ROOT/package.json"
    die "expo prebuild failed"
  fi
  cp "$STATE/package.json.bak" "$ROOT/package.json"
}

build() {
  log "Building debug APK for $ARCH (incremental; log: $STATE/gradle.log)"
  if ! (cd "$ROOT/android" && ./gradlew assembleDebug -PreactNativeArchitectures="$ARCH" --console=plain) \
    >"$STATE/gradle.log" 2>&1; then
    tail -n 40 "$STATE/gradle.log"
    die "Gradle build failed; full log: $STATE/gradle.log"
  fi
  grep -m1 '^BUILD' "$STATE/gradle.log"
}

wait_boot() {
  for _ in $(seq 90); do
    SERIAL=$(find_serial)
    [ -n "$SERIAL" ] && break
    sleep 2
  done
  [ -n "$SERIAL" ] || die "emulator $AVD did not show up in 'adb devices'"
  if [ "$(a shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; then
    log "Emulator $SERIAL is booted"
    return
  fi
  log "Waiting for $SERIAL to finish booting"
  timeout 300 adb -s "$SERIAL" wait-for-device
  for _ in $(seq 150); do
    if [ "$(a shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; then
      echo "sys.boot_completed=1"
      return
    fi
    sleep 2
  done
  die "emulator did not finish booting within 5 minutes"
}

install_apk() {
  local path dev_sha="" local_sha
  path=$(a shell pm path "$APP_ID" 2>/dev/null | tr -d '\r' | head -n1 || true)
  path=${path#package:}
  [ -n "$path" ] && dev_sha=$(a shell sha256sum "$path" 2>/dev/null | tr -d '\r' | cut -d' ' -f1 || true)
  local_sha=$(sha256sum "$APK" | cut -d' ' -f1)
  if [ "$dev_sha" = "$local_sha" ]; then
    log "Installed APK is already current (skip install)"
    return
  fi
  log "Installing $APK"
  # ./gradlew installDebug cannot see the Windows adb server from WSL; adb install can.
  a install -r "$APK" | tr -d '\r'
  INSTALLED=1
}

start_forwarder() {
  local holder
  holder=$(ss -Hltnp "sport = :$BUNDLER_PORT" | head -n1)
  if [[ $holder == *'"socat"'* ]]; then
    log "IPv4 forwarder already on 127.0.0.1:$BUNDLER_PORT (skip)"
  elif [ -n "$holder" ]; then
    die "port $BUNDLER_PORT is taken by: $holder
  A Metro started with plain 'npx expo start' listens on IPv6 only and the emulator cannot
  reach it. Stop it; this script runs Metro on $METRO_PORT behind an IPv4 forwarder on $BUNDLER_PORT."
  else
    log "Starting IPv4 forwarder 127.0.0.1:$BUNDLER_PORT -> Metro :$METRO_PORT"
    setsid nohup socat "TCP4-LISTEN:$BUNDLER_PORT,bind=127.0.0.1,reuseaddr,fork" \
      "TCP4:127.0.0.1:$METRO_PORT" >"$STATE/socat.log" 2>&1 </dev/null &
    echo $! >"$STATE/socat.pid"
  fi
  # WSL publishes new listeners to Windows only after a few seconds, so poll from the emulator.
  log "Checking the emulator reaches Metro at 10.0.2.2:$BUNDLER_PORT"
  for _ in $(seq 30); do
    if [[ $(a shell "(printf 'GET /status HTTP/1.0\r\n\r\n'; sleep 2) | nc -w 5 10.0.2.2 $BUNDLER_PORT" \
      2>/dev/null) == *packager-status:running* ]]; then
      echo "reachable"
      return
    fi
    sleep 1
  done
  die "the emulator cannot reach Metro at 10.0.2.2:$BUNDLER_PORT"
}

reverse_api_port() {
  local port
  port=$(sed -nE 's#^EXPO_PUBLIC_API_URL=https?://(localhost|127\.0\.0\.1):([0-9]+).*#\2#p' \
    "$ROOT/.env" 2>/dev/null | head -n1 || true)
  if [ -z "$port" ]; then
    log "EXPO_PUBLIC_API_URL is not a localhost URL; no adb reverse needed"
    return
  fi
  if [[ $(a reverse --list | tr -d '\r') == *"tcp:$port tcp:$port"* ]]; then
    log "adb reverse tcp:$port already set (skip)"
  else
    log "adb reverse tcp:$port (API port from .env)"
    a reverse "tcp:$port" "tcp:$port" >/dev/null
  fi
  [ -n "$(ss -Hltn "sport = :$port")" ] ||
    echo "note: nothing listens on WSL port $port yet; start the backend before logging in"
}

launch() {
  local pid top
  pid=$(a shell pidof "$APP_ID" 2>/dev/null | tr -d '\r' || true)
  top=$(a shell dumpsys activity activities 2>/dev/null | tr -d '\r' | grep -m1 topResumedActivity || true)
  if [ "$INSTALLED" = 0 ] && [ -n "$pid" ] && [[ $top == *"$APP_ID/"* ]]; then
    log "App already running in the foreground (skip launch)"
    return
  fi
  log "Launching $APP_ID/$ACTIVITY"
  a logcat -c
  a shell am start -n "$APP_ID/$ACTIVITY" | tr -d '\r'
  LAUNCHED=1
}

verify() {
  local logs crash pid
  if [ "$LAUNCHED" = 1 ]; then
    log "Waiting for the JS bundle (about 10 s after a fresh Metro start)"
    for _ in $(seq 90); do
      logs=$(a logcat -d 2>/dev/null | tr -d '\r' || true)
      [[ $logs == *'ReactNativeJS: Running "main"'* || $logs == *'Unable to load script'* ||
        $logs == *'FATAL EXCEPTION'* ]] && break
      sleep 2
    done
    sleep 3 # let the first screen render
  fi
  logs=$(a logcat -d 2>/dev/null | tr -d '\r' || true)
  crash=$(a logcat -d -b crash 2>/dev/null | tr -d '\r' | grep -v '^-----' || true)
  pid=$(a shell pidof "$APP_ID" 2>/dev/null | tr -d '\r' || true)
  a exec-out screencap -p >"$STATE/screenshot.png"
  [ -z "$crash" ] || die "crash buffer is not empty:
$crash"
  [[ $logs != *'FATAL EXCEPTION'* ]] || die "FATAL EXCEPTION in logcat (adb -s $SERIAL logcat -d)"
  [[ $logs != *'Unable to load script'* ]] || die "app could not load its JS bundle from Metro"
  [ -n "$pid" ] || die "$APP_ID is not running"
  if [ "$LAUNCHED" = 1 ] && [[ $logs != *'ReactNativeJS: Running "main"'* ]]; then
    die "JS app did not start within 3 minutes"
  fi
  log "GopherFit is running on $SERIAL (pid $pid). Screenshot: $STATE/screenshot.png"
  echo "Metro log: $STATE/metro.log   Stop everything: scripts/run-android.sh stop"
}

stop_all() {
  local name pid
  SERIAL=$(find_serial)
  if [ -n "$SERIAL" ]; then
    log "Stopping $APP_ID and emulator $SERIAL"
    a shell am force-stop "$APP_ID" || true
    a emu kill | tr -d '\r' || true
    for _ in $(seq 30); do [ -z "$(find_serial)" ] && break; sleep 2; done
  else
    log "Emulator $AVD is not running"
  fi
  for name in metro socat; do
    [ -f "$STATE/$name.pid" ] || continue
    pid=$(cat "$STATE/$name.pid")
    # setsid made the pid a process-group leader; kill the whole group (npm/sh/node).
    kill -- "-$pid" 2>/dev/null && log "Stopped $name (process group $pid)" || true
    rm -f "$STATE/$name.pid"
  done
  log "Stopping Gradle daemons"
  (cd "$ROOT/android" 2>/dev/null && ./gradlew --stop -q) || true
  adb devices | tr -d '\r'
}

case "${1:-start}" in
  start) ;;
  stop) stop_all; exit 0 ;;
  *) die "usage: $0 [start|stop]" ;;
esac

preflight
start_emulator
start_metro
ensure_native_project
build
wait_boot
install_apk
start_forwarder
reverse_api_port
launch
verify
