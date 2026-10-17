import { useSyncExternalStore } from "react";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function readCookie(name: string, fallback: boolean): boolean {
  if (typeof document === "undefined") return fallback;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] === "1" : fallback;
}

function writeCookie(name: string, value: boolean) {
  document.cookie = `${name}=${value ? "1" : "0"};max-age=${COOKIE_MAX_AGE};path=/`;
}

// Skill points hard cap
const HARDCAP_COOKIE = "sp_hardcap";
let hardcapEnabled = readCookie(HARDCAP_COOKIE, false);
const hardcapListeners = new Set<() => void>();

export function isHardcapEnabled() {
  return hardcapEnabled;
}

export function setHardcapEnabled(enabled: boolean) {
  hardcapEnabled = enabled;
  writeCookie(HARDCAP_COOKIE, enabled);
  hardcapListeners.forEach((listener) => listener());
}

const subscribeHardcap = (listener: () => void) => {
  hardcapListeners.add(listener);
  return () => {
    hardcapListeners.delete(listener);
  };
};

// The hard cap setting, re-rendering when the settings dialog changes it.
export const useHardcapEnabled = () => useSyncExternalStore(subscribeHardcap, isHardcapEnabled, () => false);
