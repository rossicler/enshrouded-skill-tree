const COOKIE_NAME = "sound_enabled";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

function readSoundCookie(): boolean {
  if (typeof document === "undefined") return false;
  const match = document.cookie.match(/(?:^|;\s*)sound_enabled=([^;]*)/);
  return match ? match[1] === "1" : false;
}

let soundEnabled = readSoundCookie();

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  document.cookie = `${COOKIE_NAME}=${enabled ? "1" : "0"};max-age=${COOKIE_MAX_AGE};path=/`;
}

export async function playSound(name: "node-hover" | "node-out-of-range" | "node-refund" | "node-select" | "node-unlock", volume = 0.5): Promise<boolean> {
  if (!soundEnabled) return false;
  const audio = new Audio(`/assets/sounds/${name}.mp3`);
  audio.volume = volume;
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
