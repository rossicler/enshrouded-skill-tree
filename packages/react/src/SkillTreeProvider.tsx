import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";

import { assetUrl } from "./art";

export type SkillTreeSound = "node-hover" | "node-out-of-range" | "node-refund" | "node-select" | "node-unlock";

// Things the tree tells the host about, so the host decides how to show them.
export type SkillTreeNotice =
  // A click on a skill that isn't linked to the build yet. The tooltip flashes too.
  | { type: "out-of-range"; nodeId: string }
  // One more level would go over the hard cap.
  | { type: "hard-cap"; nodeId: string; maxPoints: number }
  // The tooltip's share button copied a link to the skill.
  | { type: "link-copied"; nodeId: string; url: string };

export type SkillTreeProviderProps = {
  // Language of skill text and the tooltip ("en" or "fr"; others fall back to English).
  locale?: string;
  // URL where the host serves this package's assets/ folder (see scripts/sync-assets.mjs).
  assetBaseUrl?: string;
  // true plays the bundled sounds, a function plays them the host's way, false is silent.
  sound?: boolean | ((name: SkillTreeSound, volume: number) => void);
  // Skill points a build may not go over. Unset: no limit.
  hardCap?: number;
  onNotice?: (notice: SkillTreeNotice) => void;
  children?: ReactNode;
};

export type SkillTreeSettings = {
  locale: string;
  assetBaseUrl: string;
  hardCap?: number;
  playSound: (name: SkillTreeSound, volume: number) => void;
  notify: (notice: SkillTreeNotice) => void;
};

export const DEFAULT_ASSET_BASE_URL = "/skill-tree";

const playBundled = (assetBaseUrl: string, name: SkillTreeSound, volume: number) => {
  if (typeof Audio === "undefined") return;
  const audio = new Audio(assetUrl(assetBaseUrl, `sounds/${name}.mp3`));
  audio.volume = volume;
  // Browsers refuse to play before the first user gesture; that's fine.
  audio.play().catch(() => {});
};

const SkillTreeContext = createContext<SkillTreeSettings | null>(null);

// Settings shared by every skill tree component below it. Components work
// without it, with English text, assets at /skill-tree, no sound and no cap.
export const SkillTreeProvider = ({
  locale = "en",
  assetBaseUrl = DEFAULT_ASSET_BASE_URL,
  sound = false,
  hardCap,
  onNotice,
  children,
}: SkillTreeProviderProps) => {
  // Callbacks go through refs, so a host passing new functions on every
  // render doesn't re-render the tree.
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const noticeRef = useRef(onNotice);
  noticeRef.current = onNotice;

  const playSound = useCallback(
    (name: SkillTreeSound, volume: number) => {
      const current = soundRef.current;
      if (typeof current === "function") current(name, volume);
      else if (current) playBundled(assetBaseUrl, name, volume);
    },
    [assetBaseUrl]
  );
  const notify = useCallback((notice: SkillTreeNotice) => noticeRef.current?.(notice), []);

  const value = useMemo(
    () => ({ locale, assetBaseUrl, hardCap, playSound, notify }),
    [locale, assetBaseUrl, hardCap, playSound, notify]
  );
  return <SkillTreeContext.Provider value={value}>{children}</SkillTreeContext.Provider>;
};

const fallback: SkillTreeSettings = {
  locale: "en",
  assetBaseUrl: DEFAULT_ASSET_BASE_URL,
  playSound: () => {},
  notify: () => {},
};

export const useSkillTreeSettings = (): SkillTreeSettings => useContext(SkillTreeContext) ?? fallback;
