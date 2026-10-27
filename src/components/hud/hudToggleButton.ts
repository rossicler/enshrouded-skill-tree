// Shared sizing for the HUD's Stats and Highlight buttons, so the two always
// line up: an icon-sized square on mobile, a fixed 140px label button from md up.
export const HUD_TOGGLE_BUTTON_CLASSES = "!w-12 !min-w-0 !px-0 md:!w-[140px] md:!min-w-[140px] md:!px-8";

// On desktop both panels can be open at once, stacked in the left column. Each
// gets half of the height the column leaves free (about 16rem goes to the
// points panel, the two buttons and the gaps), so together they always fit;
// a taller panel scrolls inside itself.
export const DESKTOP_PANEL_SIZE_CLASSES = "max-h-[min(24rem,calc((100dvh_-_16rem)_/_2))]";
