// "POWER_PARRY" -> "Power Parry": the fallback name for a type without text.
export const humanizeKey = (key: string): string =>
  key
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
