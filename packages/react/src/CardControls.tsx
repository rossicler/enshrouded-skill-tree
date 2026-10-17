import type { ReactNode } from "react";

import { uiText, type UiTextKey } from "./text";

export type CardAction = "zoom-in" | "zoom-out" | "fit" | "expand" | "fullscreen" | "exit-fullscreen" | "close";

const LABELS: Record<CardAction, UiTextKey> = {
  "zoom-in": "card.zoomIn",
  "zoom-out": "card.zoomOut",
  fit: "card.fit",
  expand: "card.expand",
  fullscreen: "card.fullscreen",
  "exit-fullscreen": "card.exitFullscreen",
  close: "card.close",
};

// 16px stroke icons, drawn here so the package needs no icon library.
const ICONS: Record<CardAction, ReactNode> = {
  "zoom-in": <path d="M8 3v10M3 8h10" />,
  "zoom-out": <path d="M3 8h10" />,
  fit: (
    <>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M8 1v2.5M8 12.5V15M1 8h2.5M12.5 8H15" />
    </>
  ),
  expand: <path d="M9.5 2H14v4.5M14 2 9 7M6.5 14H2V9.5M2 14l5-5" />,
  fullscreen: <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />,
  "exit-fullscreen": <path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4" />,
  close: <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />,
};

type CardControlsProps = {
  actions: CardAction[];
  locale: string;
  onAction: (action: CardAction) => void;
};

// A column of small icon buttons in the card's top-right corner: 28px each,
// so all of them fit a card down to about 180px tall.
export const CardControls = ({ actions, locale, onAction }: CardControlsProps) => (
  <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1">
    {actions.map((action) => {
      const label = uiText(locale, LABELS[action]);
      return (
        <button
          key={action}
          type="button"
          aria-label={label}
          title={label}
          data-card-action={action}
          onClick={() => onAction(action)}
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/20 bg-black/60 text-white/90 transition-colors hover:bg-black/80 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[action]}
          </svg>
        </button>
      );
    })}
  </div>
);
