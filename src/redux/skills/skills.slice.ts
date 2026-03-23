import SkillNodes from "@/constants/Nodes";
import { BIOMES, MAX_PLAYER_LEVEL } from "@/constants/Biomes";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";

type SkillPathsType = [string, string][];

interface SkillsState {
  selectedSkills: string[];
  codeImported?: string;
  connectedPaths: SkillPathsType;
  searchSkillResults: string[];
  flameLevel?: number;
  unlockedBiomes: string[];
  playerLevel: number;
}

const initialState = {
  selectedSkills: [],
  connectedPaths: [],
  searchSkillResults: [],
  flameLevel: 0,
  unlockedBiomes: BIOMES.map((b) => b.id),
  playerLevel: MAX_PLAYER_LEVEL,
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
    setSearchSkillResults(state, action: PayloadAction<string[]>) {
      state.searchSkillResults = action.payload;
    },
    setFlameLevel(state, action: PayloadAction<number>) {
      state.flameLevel = action.payload;
    },
    setUnlockedBiomes(state, action: PayloadAction<string[]>) {
      state.unlockedBiomes = action.payload;
    },
    setPlayerLevel(state, action: PayloadAction<number>) {
      state.playerLevel = Math.max(1, Math.min(MAX_PLAYER_LEVEL, action.payload));
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
  setSearchSkillResults,
  setFlameLevel,
  setUnlockedBiomes,
  setPlayerLevel,
} = skillsSlice.actions;

const persistConfig = {
  key: "skills",
  version: 1,
  storage: storageSession,
  whitelist: ["selectedSkills", "connectedPaths", "unlockedBiomes", "playerLevel"],
};

export default persistReducer(persistConfig, skillsSlice.reducer);
