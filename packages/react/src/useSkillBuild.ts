import { useCallback, useState } from "react";
import { buildToSelection, sanitizeSelection, type SkillBuild, type SkillSelection } from "@enshrouded/core";

// State for a <SkillTreeView> when the host doesn't keep its own:
//   const build = useSkillBuild();
//   <SkillTreeView selection={build.selection} onSelectionChange={build.onSelectionChange} />
// Nothing is saved; persist `selection` (or a build code of it) yourself.
export const useSkillBuild = (initial: SkillSelection = {}) => {
  const [selection, setSelection] = useState<SkillSelection>(() => sanitizeSelection(initial).selection);
  const onSelectionChange = useCallback((next: SkillSelection) => setSelection(next), []);
  const reset = useCallback(() => setSelection({}), []);
  // Loads a decoded build code, fitted to the current tree. Returns what had to change.
  const load = useCallback((build: SkillBuild) => {
    const cleanup = sanitizeSelection(buildToSelection(build));
    setSelection(cleanup.selection);
    return cleanup;
  }, []);
  return { selection, setSelection, onSelectionChange, reset, load };
};
