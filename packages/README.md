# Embedding the skill tree

This folder holds the skill tree as two packages that another app can use. The
planner site at the repo root is built on them too.

| Package | What it is | Where it runs |
|---|---|---|
| `@enshrouded/core` | Tree data and positions, unlock and refund rules, build codes, points, stats, skill text (en, fr) and search. Plain TypeScript: no React, no browser globals. | Server and client (also plain Node). |
| `@enshrouded/react` | The SVG tree view (pan, zoom, tooltips, the planner's click rules), a card, hooks and panels for points, stats and search, and the game-styled UI kit. Also ships the art, sounds and Tailwind tokens. | Client only. Its entry is `"use client"`. |

Both packages ship TypeScript source with no build step, so the host compiles
them. They are tested with Next.js 16 (App Router and Pages Router), React 19,
Tailwind 4 and yarn 1 workspaces (npm workspaces should work the same way, but
aren't tested). Like the rest of this repo, they are GPL-3.0-or-later.

They aren't published to npm yet: nothing outside this repo uses them today,
so a git submodule (below) is the way in. If you want to build something on
them, open an issue: publishing them to npm is on the table once someone
actively uses them.

## Setup in a host app

The steps below assume a Next.js app with Tailwind 4, and put this repo at
`skill-tree/` in it. Swap that path for your own everywhere.

### 1. Add the repo as a git submodule

```bash
git submodule add https://github.com/rossicler/enshrouded-skill-tree.git skill-tree
```

Keep the submodule **inside** the host's project folder. Turbopack (the default
bundler in Next 16) doesn't compile files outside the project root.

Anyone cloning the host then runs `git clone --recurse-submodules`, or
`git submodule update --init` after a plain clone.

### 2. Add the packages as workspaces

In the host's `package.json`:

```json
{
  "private": true,
  "workspaces": ["skill-tree/packages/*"],
  "dependencies": {
    "@enshrouded/core": "*",
    "@enshrouded/react": "*"
  }
}
```

Then run `yarn install` at the host's root. The packages' own dependencies
(i18next, Headless UI, react-tooltip, react-zoom-pan-pinch, DOMPurify,
lucide-react, tailwind-merge) are installed with the host's. React and
React DOM are peer dependencies, so the host's copy is used.

**Never run an install inside `skill-tree/`.** A `skill-tree/node_modules`
would give the packages a second copy of React and of their dependencies.

List only `skill-tree/packages/*`, not `skill-tree` itself: the repo root is
the planner site, and it isn't meant to be installed in a host.

### 3. Next.js config

```js
// next.config.mjs (or the same key in next.config.ts)
const nextConfig = {
  // The packages ship TypeScript source.
  transpilePackages: ["@enshrouded/core", "@enshrouded/react"],
};
export default nextConfig;
```

Keep TypeScript from checking the planner site's own source, which the
default `**/*.ts` include would pick up (the packages are still checked
through your imports):

```json
// tsconfig.json
{ "exclude": ["node_modules", "skill-tree"] }
```

### 4. Tailwind 4

The React package is styled with Tailwind classes. In the host's main CSS file
(paths are relative to that file):

```css
@import "tailwindcss";
@import "../skill-tree/packages/react/theme.css";
@source "../skill-tree/packages/react/src";
```

`theme.css` only adds tokens prefixed `skill-tree-`, so it doesn't change the
host's theme. This works with either Tailwind integration: `@tailwindcss/postcss`,
or the `@tailwindcss/turbopack` loader that `create-next-app` sets up.

### 5. Art and sounds

The node art, labels, UI icons, decorations, backgrounds and sounds are in
`packages/react/assets`. Copy them into the host's `public/` folder before
every dev and build run:

```json
{
  "scripts": {
    "sync-assets": "node skill-tree/packages/react/scripts/sync-assets.mjs public/skill-tree",
    "predev": "yarn sync-assets",
    "prebuild": "yarn sync-assets"
  }
}
```

With npm, use `npm run sync-assets` in the two hooks. The script owns the
destination folder: it copies new and changed files and deletes the ones the
package no longer has. Add `/public/skill-tree/` to the
host's `.gitignore`. The URL the files are served at is the provider's
`assetBaseUrl` (default `/skill-tree`).

### 6. The provider

Put the tree's components under one `SkillTreeProvider`. In the App Router it
goes in a client component, because it takes functions:

```tsx
// app/skill-tree-providers.tsx
"use client";
import type { ReactNode } from "react";
import { SkillTreeProvider, type SkillTreeNotice } from "@enshrouded/react";

export function SkillTreeProviders({ locale, children }: { locale: string; children: ReactNode }) {
  const onNotice = (notice: SkillTreeNotice) => {
    // "out-of-range" | "hard-cap" | "link-copied": show a toast, or ignore it.
    console.info(notice);
  };
  return (
    <SkillTreeProvider
      locale={locale}             // "en" or "fr"; anything else falls back to English
      assetBaseUrl="/skill-tree"  // where step 5 serves the assets
      sound={false}               // true plays the bundled sounds; a function plays them your way
      hardCap={undefined}         // skill points a build may not go over (unset: no limit)
      onNotice={onNotice}
    >
      {children}
    </SkillTreeProvider>
  );
}
```

Without a provider, components use English, `/skill-tree`, no sound and no cap.
The provider's context reaches the card's expand overlay and dialogs, which
portal to `<body>`.

### 7. Updating

Move the submodule pointer, reinstall and rebuild:

```bash
git -C skill-tree fetch
git -C skill-tree checkout <tag, branch or commit>
git add skill-tree
yarn install          # in case the packages' dependencies changed
```

A game update changes the tree data inside `@enshrouded/core`. Saved builds
keep loading (see Contracts).

## Examples

### Server side: read a build code with core

Core runs in server components, route handlers and scripts.

```tsx
// app/build-summary.tsx (a server component)
import {
  InvalidSkillBuildError,
  buildToSelection,
  decodeSkillBuild,
  encodeSkillBuild,
  getNodeName,
  getPointsSummary,
  getTotalStats,
  sanitizeSelection,
  selectionToBuild,
  type SkillBuild,
} from "@enshrouded/core";

export function BuildSummary({ code, locale = "en" }: { code: string; locale?: string }) {
  let build: SkillBuild;
  try {
    build = decodeSkillBuild(code);
  } catch (error) {
    if (error instanceof InvalidSkillBuildError) return <p>Not a build code.</p>;
    throw error;
  }
  // Fit the build to the current tree. removed, disconnected and clamped list the skill IDs that changed.
  const { selection, removed, disconnected, clamped } = sanitizeSelection(buildToSelection(build));
  // Without unlockedBiomes in the build, the budget counts every biome.
  const points = getPointsSummary(selection, { playerLevel: build.playerLevel, biomes: build.unlockedBiomes });
  const stats = getTotalStats(selection); // { CONS, STR, ENDURANCE, DEX, SPIRIT, INT } at flame level 1
  const cleanCode = encodeSkillBuild(selectionToBuild(selection)); // the code to store from now on

  return (
    <article>
      <p>{points.used} / {points.max} points</p>
      <ul>
        {Object.entries(selection).map(([id, level]) => (
          <li key={id}>{getNodeName(id, locale)} ({level})</li>
        ))}
      </ul>
      <pre>{JSON.stringify(stats)}</pre>
    </article>
  );
}
```

```tsx
// app/builds/[code]/page.tsx
import { Suspense } from "react";
import { BuildSummary } from "../../build-summary";

export default function BuildPage({ params }: PageProps<"/builds/[code]">) {
  // With cacheComponents on (the create-next-app default), reading params needs a Suspense boundary.
  return (
    <Suspense fallback={<p>Loading…</p>}>
      {params.then(({ code }) => <BuildSummary code={decodeURIComponent(code)} />)}
    </Suspense>
  );
}
```

Other core functions: `getSkillText(type, locale, level)` (name, description
lines as HTML, per-level line), `searchSkills(query, locale)`, `getPointsUsed`,
`getMaxSkillPoints`, `applySkillAction` (what a click on a node does, as a pure
function), `parseSkillBuild` (a build from a JSON file), `BIOMES`,
`MAX_PLAYER_LEVEL`, `MAX_FLAME_LEVEL`, and the tree itself as `SkillNodes`.
Everything is exported from `packages/core/src/index.ts`. Skill text is HTML;
sanitize it before rendering it yourself (the React package does).

### The card

`SkillTreeCard` shows the whole tree fitted to a box. It fills its container,
so size the container (a side left unsized falls back to 360 px). Drag pans;
the wheel zooms only once the card has focus or with Ctrl, so the page scrolls
past it. Its buttons zoom, expand it to an overlay over the page, and show it
fullscreen.

```tsx
"use client";
import { SkillTreeCard, useSkillBuild } from "@enshrouded/react";

export function BuildCards({ saved }: { saved: Record<string, number> }) {
  const build = useSkillBuild(saved); // local state, fitted to the current tree
  return (
    <div className="flex gap-6">
      {/* Editable: click unlocks or levels up, right-click refunds (touch: double tap, long press). */}
      <div style={{ width: 360, height: 360 }}>
        <SkillTreeCard selection={build.selection} onSelectionChange={build.onSelectionChange} />
      </div>
      {/* Read-only: tooltips without buttons. Omitting onSelectionChange does the same. */}
      <div style={{ width: 360, height: 360 }}>
        <SkillTreeCard selection={saved} readOnly background={false} label="Saved build" />
      </div>
    </div>
  );
}
```

More props: `background` (`true`, the default, shows the planner's backdrop
art; `false` a dark gradient; a string is any CSS background), `controls`
(the buttons, default true), `highlightedTypes`, `confirmRefund`,
`getNodeShareUrl`, `onModeChange`, `className` and `style`. Through a ref
(`SkillTreeCardHandle`): `expand()`, `fullscreen()`, `close()`, plus the view's
methods below. Fullscreen falls back to the overlay where the browser has no
Fullscreen API.

### The full view

`SkillTreeView` is the planner's view: a fixed starting zoom, wheel zoom
without focus, and the share button in tooltips when you give
`getNodeShareUrl`. It fills its container. A node's tooltip opens on hover
(after 500 ms) or a tap, and closes when the mouse leaves it, on a press
anywhere outside it, on Escape, from its × button, or when the tree is panned
or zoomed.

```tsx
"use client";
import { useRef } from "react";
import { SkillTreeView, useSkillBuild, type SkillTreeViewHandle } from "@enshrouded/react";

export function Planner() {
  const build = useSkillBuild();
  const view = useRef<SkillTreeViewHandle>(null);
  return (
    <div style={{ height: "100dvh" }}>
      <button onClick={() => view.current?.zoomIn()}>+</button>
      <button onClick={() => view.current?.zoomOut()}>-</button>
      <button onClick={() => view.current?.center()}>Center</button>
      <button onClick={() => view.current?.focusNode("12", { showTooltip: true })}>Find skill 12</button>
      <SkillTreeView
        ref={view}
        selection={build.selection}
        onSelectionChange={build.onSelectionChange}
        // Asked before a refund that also removes other skills. May return a promise.
        confirmRefund={({ removed }) => window.confirm(`Also refund ${removed.length - 1} linked skills?`)}
        getNodeShareUrl={(id) => `${location.origin}/?focus=${id}`}
        initialFocusNodeId={undefined}
        initialView="center" // or "fit"
      />
    </div>
  );
}
```

`onSelectionChange(next, change)` gets the new selection and what happened
(`change.type` is `unlock`, `level-up`, `level-down` or `refund`).

### Points, stats and search

The hooks are thin wrappers over core; the panels take values and callbacks and
hold no state of their own.

```tsx
"use client";
import { useCallback, useRef, useState } from "react";
import { BIOMES, MAX_PLAYER_LEVEL } from "@enshrouded/core";
import {
  PointsPanel, SkillSearch, SkillTreeCard, StatsButton, StatsList,
  usePoints, useSkillBuild, useSkillSearch, useStats, type SkillTreeCardHandle,
} from "@enshrouded/react";

export function WiredPlanner({ locale }: { locale: string }) {
  const build = useSkillBuild();
  const [flameLevel, setFlameLevel] = useState(1);
  const [playerLevel, setPlayerLevel] = useState(MAX_PLAYER_LEVEL);
  const [biomes, setBiomes] = useState(BIOMES.map((biome) => biome.id));
  const [query, setQuery] = useState("");
  const points = usePoints(build.selection, { playerLevel, biomes }); // { used, max, left, full, over }
  const stats = useStats(build.selection, flameLevel);
  const search = useSkillSearch(query, locale); // { results, highlightedTypes }
  const card = useRef<SkillTreeCardHandle>(null);
  const focusNode = useCallback((id: string) => card.current?.focusNode(id, { showTooltip: true }), []);

  return (
    <div className="flex gap-6">
      <div style={{ width: 480, height: 480 }}>
        <SkillTreeCard ref={card} selection={build.selection} onSelectionChange={build.onSelectionChange}
          highlightedTypes={search.highlightedTypes} />
      </div>
      {/* The panels' corner ornaments reach about 40 px outside them from the md breakpoint up. */}
      <div className="flex w-[340px] flex-col gap-4 md:px-6">
        <SkillSearch query={query} onQueryChange={setQuery} results={search.results} onFocusNode={focusNode} look="decorated" />
        <PointsPanel
          pointsUsed={points.used} maxPoints={points.max}
          flameLevel={flameLevel} onFlameLevelChange={setFlameLevel}
          playerLevel={playerLevel} biomes={biomes}
          onPlayerLevelChange={setPlayerLevel} onBiomesChange={setBiomes} // both: shows the budget button
        />
        <StatsList stats={stats} />
        <StatsButton stats={stats} />
      </div>
    </div>
  );
}
```

`PointsPanel` also has `layout="bar"`. `FlameLevelControl`, `BiomeBudgetButton`,
`BiomeBudgetDialog` and `StatsDialog` are exported on their own, as is the UI
kit (`GameButton`, `GameButtonGroup`, `GamePanel`, `GameInput`, `GameTooltip`,
`CopyInput`, `GameDialog`). The package's own text (tooltips, buttons, panels)
follows the provider's `locale`; `useUiText()` reads it.

### `useSkillBuild`

`useSkillBuild(initial?)` keeps a selection in React state and returns
`{ selection, setSelection, onSelectionChange, reset, load }`. `initial` is
sanitized once. `load(build)` takes a decoded `SkillBuild`, fits it to the
current tree and returns what changed:

```tsx
const cleanup = build.load(decodeSkillBuild(code));
if (hasSelectionChanges(cleanup)) {
  // cleanup.removed, cleanup.disconnected, cleanup.clamped: skill IDs (names via getNodeName)
}
```

## Contracts

- **The build code format is stable.** A code is
  `btoa(JSON.stringify(build))` of a `SkillBuild`
  (`{ skills, treeContentHash?, skillLevels?, playerLevel?, unlockedBiomes? }`),
  made with `encodeSkillBuild(selectionToBuild(selection, options))`. Codes
  from the planner site load in any host and the other way round, and old
  codes (including the first `string[]` format) keep loading. The format only
  ever gains optional fields.
- **Node IDs never change meaning.** Game updates may add skills, retire
  them or move them, but an ID is never reused.
- **`sanitizeSelection` handles old builds and game updates.** Run every
  loaded build through it (`useSkillBuild` and `load` do): it drops IDs that
  are no longer in the tree and skills cut off from a starting node, and
  clamps levels to the current maximum. `isDifferentTreeVersion(build)` tells
  you the build was made on another version of the tree.
- **Saving is the host's job.** The packages keep no storage, send nothing
  over the network and show no toasts or dialogs: store the selection or its
  code wherever you like, and handle `onNotice` and `confirmRefund` your way.

## Known limits

- Two locales, `en` and `fr`. Both are bundled into the client (about 30 kB
  gzipped).
- Node art is served as plain PNGs (about 2 MB in all, cached after the first
  load), not through `next/image`.
- In a small card at the fitted view, nodes are a few pixels wide; users
  normally zoom in first. The tooltip is the planner's full-size one.
- The card measures its container once, on mount.
- A touch that starts on a card pans the tree instead of scrolling the page
  (`touch-action: none`).
- The expand overlay is at z-index 10000 and portals to `<body>`. The kit's
  dialogs are at z-index 50, so one opened from inside an expanded card sits
  below the overlay.
- Client components are rendered on the server too, so each tree view puts
  its whole SVG in the page's HTML: about 200 kB per view, 18 kB gzipped.
  For a page listing many builds, summarize them with core and show a card
  when one is opened.
