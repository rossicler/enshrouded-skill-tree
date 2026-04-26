import SkillNodes, { getMaxLevel } from "@/constants/Nodes";
import { BIOMES, MAX_PLAYER_LEVEL } from "@/constants/Biomes";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createMigrate, persistReducer } from "redux-persist";
import type { PersistedState } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";

type SkillPathsType = [string, string][];
type SelectedSkillsMap = { [id: string]: number };

interface SkillsState {
  selectedSkills: SelectedSkillsMap;
  codeImported?: string;
  connectedPaths: SkillPathsType;
  searchSkillResults: string[];
  flameLevel?: number;
  unlockedBiomes: string[];
  playerLevel: number;
}

const initialState = {
  selectedSkills: {},
  connectedPaths: [],
  searchSkillResults: [],
  flameLevel: 0,
  unlockedBiomes: BIOMES.map((b) => b.id),
  playerLevel: MAX_PLAYER_LEVEL,
} satisfies SkillsState as SkillsState;

const normalizeToMap = (
  payload: SelectedSkillsMap | string[]
): SelectedSkillsMap => {
  if (Array.isArray(payload)) {
    const out: SelectedSkillsMap = {};
    payload.forEach((id) => {
      out[id] = 1;
    });
    return out;
  }
  return payload;
};

const skillsSlice = createSlice({
  name: "skills",
  initialState,
  reducers: {
    loadSelectedSkills(
      state,
      action: PayloadAction<SelectedSkillsMap | string[]>
    ) {
      state.selectedSkills = normalizeToMap(action.payload);
    },
    incrementSelectedSkill(state, action: PayloadAction<string>) {
      const id = action.payload;
      const node = SkillNodes.nodes[id];
      if (!node) return;
      const max = getMaxLevel(node.type);
      const current = state.selectedSkills[id] ?? 0;
      state.selectedSkills[id] = Math.min(max, current + 1);
    },
    decrementSelectedSkill(state, action: PayloadAction<string>) {
      const id = action.payload;
      const current = state.selectedSkills[id] ?? 0;
      if (current <= 1) {
        delete state.selectedSkills[id];
      } else {
        state.selectedSkills[id] = current - 1;
      }
    },
    removeSelectedSkill(state, action: PayloadAction<string[]>) {
      action.payload.forEach((id) => {
        delete state.selectedSkills[id];
      });
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
  incrementSelectedSkill,
  decrementSelectedSkill,
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

export const selectSelectedSkillIds = createSelector(
  [(state: { skill: SkillsState }) => state.skill.selectedSkills],
  (skills) => Object.keys(skills)
);

const migrations = {
  2: (state: PersistedState): PersistedState => {
    if (!state) return state;
    const anyState = state as unknown as { selectedSkills?: unknown };
    if (Array.isArray(anyState.selectedSkills)) {
      const obj: SelectedSkillsMap = {};
      (anyState.selectedSkills as string[]).forEach((id) => {
        obj[id] = 1;
      });
      return { ...state, selectedSkills: obj } as PersistedState;
    }
    return state;
  },
};

const persistConfig = {
  key: "skills",
  version: 2,
  storage: storageSession,
  whitelist: ["selectedSkills", "connectedPaths", "unlockedBiomes", "playerLevel"],
  migrate: createMigrate(migrations, { debug: false }),
};

export default persistReducer(persistConfig, skillsSlice.reducer);
