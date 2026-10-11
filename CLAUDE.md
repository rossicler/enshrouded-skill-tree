# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Enshrouded Skill Planner: a Next.js 14 (pages router) app for planning and sharing Enshrouded skill-tree builds. It uses Redux Toolkit, Tailwind and next-i18next (`en`, `fr`). MongoDB is optional; it only backs short share URLs. Node 24 (`.nvmrc`, `engines`), and the package manager is yarn (`yarn.lock`).

## Commands

```bash
yarn dev                                  # dev server on :3000
yarn build                                # prebuild runs validate-translations + generate-version first
yarn test                                 # vitest run (src/**/__tests__ and scripts/*.test.mjs)
yarn vitest run src/utils/__tests__/nodePosition.test.ts   # single test file
yarn vitest run -t "name substring"       # single test by name
yarn tsc --noEmit --incremental false     # type check
yarn validate-translations                # check every locale has all text the app shows or searches
yarn import-skills <export.json> [--changes=path] [--apply]  # preview/apply a game import (see below)
```

Setting `SKILL_DATA_EXPORT=<path to enshrouded-tools export>` turns on an extra full-source integration test in `scripts/skill-data.test.mjs`.

Env (`.env.local`, see `.env.example`): `BASE_URL`, `MONGODB_URI`, `NEXT_PUBLIC_GOOGLE_ANALYTICS`. `MONGODB_URI` is optional: `src/lib/mongodb.ts` connects lazily via `getMongoClient()`, and without the variable the app runs with DB features off (`/api/code` returns 503). The `dev-no-db` entry in `.claude/launch.json` runs the dev server on port 3001 and assumes no `MONGODB_URI` in `.env.local`.

`yarn lint` is not usable: there is no ESLint config, so `next lint` starts an interactive setup prompt.

## Architecture

### Skill tree data: generated structure plus authored presentation
- `src/constants/gameSkillData.json` is **generated** by `yarn import-skills` (`scripts/skill-data.mjs`). Never edit it by hand. It is the source of node membership (**stable string app IDs**), types, cartesian positions, base links (`base`, `baseAnchor`), costs, levels, game text values, `retired` IDs, and `edges`.
- `edges` are undirected `[low, high]` pairs. `buildSkillTree` in `src/constants/Nodes.ts` expands each pair into adjacency on **both** endpoints, because unlocking works from either side, and it throws on unknown endpoints or on types without authored presentation.
- `src/constants/LegacyNodes.ts` holds only app-owned presentation: type colors, icons/assets and fallback text, plus a per-node `tier`. A new type needs an entry here before an import can be applied. Import `SkillNodes`, `getMaxLevel` and `RETIRED_NODES` from `@/constants/Nodes`.
- Node IDs are persisted in saved and shared builds. **Never renumber or reuse IDs.** `scripts/skill-data-mapping.json` holds `nodes` (game ID → app ID/type) and `retired` app IDs. Imports match by game ID and always write a diff to `.local/skill-data/` (`summary.md`, `report.json`, `changes.proposed.json`). Additions, removals, re-IDs, retypes and edge or base changes are refused on `--apply` until they are approved in `.local/skill-data/changes.json`. `scripts/skill-data-structure.test.mjs` tests this against a synthetic export (`scripts/fixtures/synthetic-export.mjs`); never run `--apply` with a synthetic export in the real checkout, because it overwrites real data.
- Game updates (export, preview, review, apply, verify) are run by the `enshrouded-game-update` skill in the sibling repo `../enshrouded-tools` (`.agents/skills/`, with a `.claude/skills/` wrapper), so start them from a session there. `docs/game-metadata-migration.md` describes the full import workflow and its known exception (Ranger stats). Read it before touching import or node data.

### Positioning
`src/utils/nodePosition.ts` (`resolveNodePosition`) handles legacy `angle`/`distance` fields, `position: {kind:"polar"}` and `position: {kind:"cartesian", x, y}`. An explicit `position` wins over the legacy fields. +X points right and +Y points down, with the tree center as origin. Base nodes connect to the 198-unit core circle, or to an explicit `baseAnchor`.

### Text and localization
- `public/locales/{en,fr}/common.json` holds UI strings and `nodes.json` holds per-type text. Imported game text (English and French) lives under each record's `game` key. A locale shows `game` text when the type's `gameTextLocales` lists it, otherwise its own translation; `skillTextPrefix` (`src/utils/skillText.ts`) picks the record, and the tooltip, search, toasts and `?focus=` all use it.
- `scripts/validate-translations.js` (run by `prebuild`, so a failure breaks the build) loads the app's tree and interpolation through `jiti` and checks what each locale actually shows: the zod schema (strict, no extra keys), an entry for every type in `LegacyNodes.ts`, and, for every type in the tree, a `name`, a `description` whose `{{placeholders}}` all have values at every level, and a per-level line in the locale's language (`perLevelLabel`; outside English the authored `perLevel.label` fallback is English, so it is an error). For `common.json` it checks key and placeholder parity with `en`, every key the code references (literal `t()`/`i18nKey`, and string literals naming a key in a known section), and every value of keys built at runtime (`biomes.<id>`, `treeLabels.<nameKey>`). A new ``t(`prefix${...}`)`` prefix fails until it is listed under `families` in the script. The importer only refuses `--apply` for a new type without a `description`; the build check covers the rest.
- Descriptions are i18next templates. Their numeric values come from node-type metadata: `gameValues`, `gameLevelValues` (indexed by purchased level) and `gamePerLevelValues`, plus the legacy `levelValues` and `perLevel`. `src/utils/skillInterpolation.ts` resolves them, and the output is sanitized with DOMPurify before rendering.

### State and build sharing
- There is a single Redux slice, `src/redux/skills/skills.slice.ts`. It holds `selectedSkills` as an `{id: level}` map (legacy builds were `string[]`, which `normalizeToMap` handles), `connectedPaths`, search results, flame level, unlocked biomes and player level. The slice is persisted to **sessionStorage** via redux-persist, with versioned migrations in the slice.
- A build's share code is `btoa(JSON.stringify(BuildData))` (`src/utils/utils.ts`). `BuildShareDialog` either places the code directly in `?code=`, or POSTs it to `/api/code`, which stores it in Mongo (`skill-planner.codes`) and returns an ObjectId used as `?shortCode=`.
- `pages/index.tsx` `getServerSideProps` resolves `shortCode`/`code`, plus `focus`. If Mongo is unset or can't connect, the page still renders without DB features (the `dbAvailable` prop) and `?code=` still loads; only `?shortCode=` needs the DB. An `ENOTFOUND` connection error renders nothing (`clusterStillProvisioning`). Every way of loading a build goes through `useLoadBuild`/`useApplySelection` (`src/hooks/useLoadBuild.ts`): share codes (`InitSkills.tsx`), JSON import (`HUD.tsx`) and a restored session on mount. These run `sanitizeSelection`, which drops retired IDs and skills disconnected from a base node and clamps levels to `maxLevel`, then toast what changed and warn about a different `treeContentHash`.
- `src/constants/skillTreeVersion.ts` derives the tree's game build, update number and content-hash revision from the generated JSON. This tree version is separate from `APP_VERSION` (`src/constants/version.ts`, which `scripts/generate-version.js` generates from package.json).

### Selection rules
Selected nodes must stay connected to a `base: true` node. `getSelectableSkills` (unselected base nodes plus unselected neighbors of selected nodes) drives unlocking. When a node is refunded, `getSkillsToRemove` and `getSubGraphNodes` in `src/utils/utils.ts` find the selected nodes that would lose their path to a base node, and those are removed along with it. A `BuildData` stores `skills` together with `skillLevels`. Point budgets come from flame level, biomes and player level (`constants/Biomes.ts`, `components/hud/BiomeBudget.tsx`), and stat totals come from `utils/stats.ts`.
