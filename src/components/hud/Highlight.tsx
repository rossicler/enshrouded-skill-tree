import { Highlighter } from "lucide-react";
import { StatHighlightButton, useUiText } from "@enshrouded/react";

import { HUD_TOGGLE_BUTTON_CLASSES } from "./hudToggleButton";

type HighlightProps = {
  value: readonly string[];
  onChange: (stats: string[]) => void;
  // Controlled by the HUD, which keeps only one panel open at a time.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // The panel's maximum height class (see HudToggle).
  panelSizeClassName?: string;
  className?: string;
};

// The stat highlight button and its panel, built like the Stats button: an
// icon on mobile, a label from md up, the same size and font.
const Highlight = ({ value, onChange, open, onOpenChange, panelSizeClassName, className }: HighlightProps) => {
  const ui = useUiText();
  return (
    <StatHighlightButton
      value={value}
      onChange={onChange}
      open={open}
      onOpenChange={onOpenChange}
      panelSizeClassName={panelSizeClassName}
      className={className}
      buttonClassName={HUD_TOGGLE_BUTTON_CLASSES}
      aria-label={ui("statHighlight.button")}
    >
      <Highlighter size={16} className="md:hidden" />
      <span className="hidden md:inline whitespace-nowrap">{ui("statHighlight.button")}</span>
    </StatHighlightButton>
  );
};

export default Highlight;
