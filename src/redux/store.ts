import { combineReducers, configureStore } from "@reduxjs/toolkit";
import storageSession from "redux-persist/lib/storage/session";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";

import skillReducer from "./skills/skills.slice";

const persistConfig = {
  key: "root",
  version: 1,
  storage: storageSession,
  whitelist: ["skill"],
};

const rootReducer = combineReducers({
  skill: skillReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
};

const store = makeStore();

export const persistor = persistStore(store);

export default store;

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
