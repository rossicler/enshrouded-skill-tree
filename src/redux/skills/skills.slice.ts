import { BIOMES, MAX_PLAYER_LEVEL } from "@enshrouded/core";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createMigrate, persistReducer } from "redux-persist";
import type { PersistedState } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";

type SelectedSkillsMap = { [id: string]: number };

interface SkillsState {
  selectedSkills: SelectedSkillsMap;
  codeImported?: string;
  searchSkillResults: string[];
  flameLevel?: number;
  unlockedBiomes: string[];
  playerLevel: number;
}

const initialState = {
  selectedSkills: {},
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
    // The whole build at once: the tree view (@enshrouded/react) applies the
    // unlock and refund rules and hands over the next selection.
    loadSelectedSkills(
      state,
      action: PayloadAction<SelectedSkillsMap | string[]>
    ) {
      state.selectedSkills = normalizeToMap(action.payload);
    },
    setCodeImported(state, action: PayloadAction<string>) {
      state.codeImported = action.payload;
    },
    clearCodeImported(state) {
      state.codeImported = undefined;
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
  setCodeImported,
  clearCodeImported,
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
  // Links drawn as connected are now derived from the selection.
  3: (state: PersistedState): PersistedState => {
    if (!state) return state;
    const { connectedPaths: _dropped, ...rest } = state as PersistedState & { connectedPaths?: unknown };
    return rest as PersistedState;
  },
};

const persistConfig = {
  key: "skills",
  version: 3,
  storage: storageSession,
  whitelist: ["selectedSkills", "unlockedBiomes", "playerLevel"],
  migrate: createMigrate(migrations, { debug: false }),
};

export default persistReducer(persistConfig, skillsSlice.reducer);
