"""On-device regression test using only Python's standard library and Android adb.

Run the disposable tests/serve_backend.py fixture and Expo Go first. Metro must
use an API URL reachable from the emulator. See docs/onboarding-verification.md.
Never run this against a real backend: the fixture marker is checked before taps.
"""

import json
from contextlib import suppress
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request
import xml.etree.ElementTree as ET

ADB = os.environ.get("ANDROID_ADB", "adb")
SERIAL = os.environ.get("ANDROID_SERIAL", "emulator-5554")
EXPO = os.environ.get("EXPO_GO_URL", "exp://127.0.0.1:8082")
API = os.environ.get("TEST_API_URL", "http://127.0.0.1:3000")
ARTIFACTS = Path(os.environ.get("ONBOARDING_ARTIFACTS", "/tmp/gopher-onboarding"))
USERNAME = "android" + str(int(time.time()))
PASSWORD = "Password1!"


def adb(*args):
    return subprocess.check_output([ADB, "-s", SERIAL, *args], timeout=30)


def shell(*args):
    return adb("shell", *args).decode().strip()


def api(path, body=None, token=None, method=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(
        API + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        data = response.read()
        return json.loads(data) if data else None


def tree():
    shell("uiautomator", "dump", "/sdcard/gopher-onboarding.xml")
    data = adb("exec-out", "cat", "/sdcard/gopher-onboarding.xml")
    (ARTIFACTS / "latest.xml").write_bytes(data)
    return ET.fromstring(data)


def bounds(node):
    return list(map(int, re.findall(r"\d+", node.get("bounds", ""))))


def find(root, label):
    # The IME/system navigation also exposes a "Back" button. Only tap app UI.
    nodes = [n for n in root.iter("node") if n.get("package") == "host.exp.exponent"]
    # Prefer the accessible control over its text child.
    for key in ("content-desc", "text"):
        for node in nodes:
            box = bounds(node)
            if node.get(key) == label and len(box) == 4 and box[3] > box[1]:
                return node
    return None


def scroll(root, up=False):
    containers = [n for n in root.iter("node")
                  if n.get("package") == "host.exp.exponent" and n.get("scrollable") == "true"]
    assert containers, "No scrollable app content"
    left, top, right, bottom = bounds(containers[0])
    x = right - 16
    # Stay inside the content, away from Android's status/navigation gestures.
    start = round(top + (bottom - top) * 0.75)
    end = round(top + (bottom - top) * 0.25)
    if up:
        start, end = end, start
    shell("input", "swipe", str(x), str(start), str(x), str(end), "350")


def locate(label, scrolling=False):
    for attempt in range(8):
        root = tree()
        node = find(root, label)
        if node is not None:
            return node
        if scrolling:
            scroll(root, up=attempt < 2)
    raise AssertionError("Not found: " + label)


def tap(label, edge=False):
    node = locate(label, scrolling=True)
    assert node.get("enabled") == "true", label + " is disabled"
    left, top, right, bottom = bounds(node)
    y = top + 12 if edge else (top + bottom) // 2
    ime_top = keyboard_top()
    assert ime_top is None or bottom <= ime_top, label + " is covered by the keyboard"
    shell("input", "tap", str((left + right) // 2), str(y))
    print("Tapped " + label, flush=True)


def fill(label, value):
    node = locate(label, scrolling=True)
    tap(label)
    # Explicit deletion also works in secure fields, where IMEs can intercept Ctrl+A.
    shell("input", "keyevent", "KEYCODE_MOVE_END")
    shell("input", "keyevent", *(["KEYCODE_DEL"] * (len(node.get("text", "")) + 1)))
    shell("input", "text", value.replace(" ", "%s"))
    actual = locate(label).get("text")
    if node.get("password") == "true":
        assert len(actual) == len(value), "Secure input was not replaced completely"
    else:
        assert actual == value, (label, actual, value)


def retained(label, value):
    assert locate(label, scrolling=True).get("text") == value, label + " was lost"


def shot(name):
    (ARTIFACTS / (name + ".png")).write_bytes(adb("exec-out", "screencap", "-p"))


def keyboard_top():
    # Filter on the device: full IME dumps can be huge and include stale Gboard state.
    state = shell("dumpsys window | grep 'type=ime .*visible=true' || true")
    match = re.search(r"type=ime frame=\[0,(\d+)\]", state)
    return int(match[1]) if match else None


def keyboard_visible():
    return keyboard_top() is not None


def main():
    assert api("/__test__/fixture") == {"disposable": True}
    assert "GopherFit_Pixel" in adb("emu", "avd", "name").decode()
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    shell("am", "start", "-S", "-W", "-a", "android.intent.action.VIEW", "-d",
          EXPO + "/--/onboarding", "host.exp.exponent")
    # Expo Go can consume the first cold-start intent while its launcher starts.
    # Deliver the link again once its process is ready; this does not clear data.
    tree()
    shell("am", "start", "-W", "-a", "android.intent.action.VIEW", "-d",
          EXPO + "/--/onboarding", "host.exp.exponent")
    locate("Step 1 of 8")
    density = int(re.findall(r"\d+", shell("wm", "density"))[-1]) / 160
    for label in ("Back", "Continue"):
        node = locate(label)
        left, top, right, bottom = bounds(node)
        assert node.get("enabled") == "true"
        assert (bottom - top) / density >= 48, label + " touch target is too short"
        assert (right - left) / density >= 48, label + " touch target is too narrow"
    shot("android-welcome")
    tap("Back")  # No previous login route: exercise the replacement fallback.
    locate("Username")
    tap("Create an account")
    locate("Step 1 of 8")
    tap("Back")  # Login exists in history: dismiss to it.
    locate("Username")
    tap("Create an account")
    tap("Continue", edge=True)  # Test padding, not just the text's touch area.
    locate("Name")
    tap("Continue")
    locate("Name must contain 1–200 characters.", scrolling=True)
    fill("Name", "Android Tester")
    assert keyboard_visible(), "Name field did not open the keyboard"
    tap("Continue")  # Must work with a keyboard showing on the first tap.
    locate("Age")
    assert not keyboard_visible(), "Advancing should dismiss the previous keyboard"
    shell("input", "keyevent", "KEYCODE_BACK")
    retained("Name", "Android Tester")
    tap("Back")
    locate("Step 1 of 8")
    tap("Continue")
    retained("Name", "Android Tester")
    tap("Continue")
    tap("Continue")
    locate("Age must be a nonnegative whole number up to 130.", scrolling=True)
    fill("Age", "0")
    tap("Continue")
    locate("Enter your age to continue.", scrolling=True)
    fill("Age", "24")
    tap("Continue")
    tap("Continue")
    locate("Enter a valid height.", scrolling=True)
    fill("Height (inches)", "70")
    tap("Continue")
    locate("Enter a valid weight.", scrolling=True)
    fill("Weight (lbs)", "170")
    tap("Continue")
    tap("Back")
    retained("Height (inches)", "70")
    retained("Weight (lbs)", "170")
    tap("Back")
    retained("Age", "24")
    tap("Continue")
    tap("Continue")
    tap("Continue")
    locate("Choose a gender to continue.", scrolling=True)
    tap("Other")
    tap("Continue")
    tap("Continue")  # Sports and goals are optional.
    tap("Back")
    tap("Hockey")
    tap("Continue")
    tap("Continue")
    tap("Back")
    tap("Build Muscle")
    tap("Continue")
    tap("Get Started")
    locate("Choose your activity level to continue.", scrolling=True)
    tap("Moderately Active")
    locate("Step 8 of 8", scrolling=True)
    shot("android-activity")
    tap("Get Started")
    fill("Username", USERNAME)
    fill("Password", "short")
    tap("Create account")
    locate("Use at least seven letters/spaces, including an uppercase letter, plus a number and punctuation or a symbol. Maximum 72 UTF-8 bytes.", scrolling=True)
    fill("Password", PASSWORD)
    tap("Back")
    assert locate("Moderately Active", scrolling=True).get("selected") == "true"
    tap("Get Started")
    retained("Username", USERNAME)
    assert len(locate("Password").get("text")) == len(PASSWORD)
    shot("android-account")
    tap("Create account")
    locate("Hi, Android Tester! 👋", scrolling=True)
    shot("android-registered")
    login = api("/auth/login", {"username": USERNAME, "password": PASSWORD})
    profile = api("/profile/", token=login["token"])
    for key, value in {"name": "Android Tester", "age": 24, "height": 178,
                       "weight": 77, "gender": "Other", "activity_level": "Moderately Active",
                       "sports": ["Hockey"], "goals": ["Build Muscle"]}.items():
        assert profile[key] == value, (key, profile[key], value)
    print("PASS Android onboarding, retained fields, validation, keyboard, and persisted registration", flush=True)
    api("/auth/account", {"password": PASSWORD}, login["token"], "DELETE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        if ARTIFACTS.exists():
            with suppress(subprocess.SubprocessError):
                shot("android-failure")
        raise
