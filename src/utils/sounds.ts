let soundEnabled = true;

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function playSound(name: "button-hover" | "node-hover" | "node-out-of-range" | "node-refund" | "node-select" | "node-unlock", volume = 0.5) {
  if (!soundEnabled) return;
  const audio = new Audio(`/assets/sounds/${name}.mp3`);
  audio.volume = volume;
  audio.play().catch(() => {});
}
