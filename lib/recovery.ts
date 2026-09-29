export type RecoveryLink = { purpose: string; token: string };
declare global {
  interface Window {
    __gopherRecovery?: RecoveryLink;
  }
}
let link: RecoveryLink | null = null;
const listeners = new Set<() => void>();
// Also runs in Expo development, where the static HTML bootstrap is absent.
function captureRecoveryLink() {
  if (typeof window === "undefined" || !window.location || !window.history)
    return null;
  if (window.__gopherRecovery) {
    link = window.__gopherRecovery;
    delete window.__gopherRecovery;
  }
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    link = {
      purpose: params.get("purpose") ?? "",
      token: params.get("token") ?? "",
    };
  }
  listeners.forEach((listener) => listener());
}
export const readRecoveryLink = () => link;
export function subscribeRecoveryLink(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function clearRecoveryLink() {
  link = null;
  if (typeof window !== "undefined") delete window.__gopherRecovery;
  listeners.forEach((listener) => listener());
}
// Capture before rendering the app and never copy the secret into navigation params.
captureRecoveryLink();
if (typeof window !== "undefined" && typeof window.addEventListener === "function")
  window.addEventListener("hashchange", captureRecoveryLink);
