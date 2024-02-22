import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface SkillsState {
  selectedSkills: string[];
  codeImported?: string;
}

const initialState = {
  selectedSkills: [],
} satisfies SkillsState as SkillsState;

const skillsSlice = createSlice({
  name: "skills",
  initialState,
  reducers: {
    loadSelectedSkills(state, action: PayloadAction<string[]>) {
      state.selectedSkills = action.payload;
      if (action.payload.length === 0) {
        state.clearTriggered = true;
      }
    },
    addSelectedSkill(state, action: PayloadAction<string>) {
      state.selectedSkills.push(action.payload);
    },
    removeSelectedSkill(state, action: PayloadAction<string[]>) {
      state.selectedSkills = state.selectedSkills.filter(
        (id) => !action.payload.includes(id)
      );
    },
    setCodeImported(state, action: PayloadAction<string>) {
      state.codeImported = action.payload;
    },
    clearCodeImported(state) {
      state.codeImported = undefined;
    },
  },
});

export const {
  loadSelectedSkills,
  addSelectedSkill,
  removeSelectedSkill,
  setCodeImported,
  clearCodeImported,
} = skillsSlice.actions;
export default skillsSlice.reducer;
