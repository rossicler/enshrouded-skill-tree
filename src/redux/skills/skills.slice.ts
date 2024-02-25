import SkillNodes from "@/constants/Nodes";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type SkillPathsType = [string, string][];

interface SkillsState {
  selectedSkills: string[];
  codeImported?: string;
  connectedPaths: SkillPathsType;
}

const initialState = {
  selectedSkills: [],
  connectedPaths: [],
} satisfies SkillsState as SkillsState;

const skillsSlice = createSlice({
  name: "skills",
  initialState,
  reducers: {
    loadSelectedSkills(state, action: PayloadAction<string[]>) {
      state.selectedSkills = action.payload;
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
    loadConnectedPaths(state, action: PayloadAction<SkillPathsType>) {
      state.connectedPaths = action.payload;
    },
    addConnectedPaths(state, action: PayloadAction<SkillPathsType>) {
      state.connectedPaths = [...state.connectedPaths, ...action.payload];
    },
    removePathsConnectedTo(state, action: PayloadAction<string[]>) {
      state.connectedPaths = state.connectedPaths.filter(
        (paths) => !action.payload.some((id) => paths.includes(id))
      );
    },
    initConnectedPaths(state, action: PayloadAction<string[]>) {
      const skills = action.payload;
      let paths: SkillPathsType = [];
      const alreadySetObj: { [key: string]: boolean } = {};
      skills.forEach((id) => {
        const connectedTo = skills.filter((to) =>
          SkillNodes.edges[id].includes(to)
        );
        connectedTo.forEach((to) => {
          const pathId = id > to ? `${id}-${to}` : `${to}-${id}`;
          if (!alreadySetObj[pathId]) {
            paths.push([id, to]);
            alreadySetObj[pathId] = true;
          }
        });
      });
      state.connectedPaths = paths;
    },
  },
});

export const {
  loadSelectedSkills,
  addSelectedSkill,
  removeSelectedSkill,
  setCodeImported,
  clearCodeImported,
  loadConnectedPaths,
  addConnectedPaths,
  removePathsConnectedTo,
  initConnectedPaths,
} = skillsSlice.actions;
export default skillsSlice.reducer;
