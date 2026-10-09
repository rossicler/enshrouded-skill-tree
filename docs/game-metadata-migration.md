# Game metadata migration

## Positioning (implemented)

Legacy `angle` / `distance` fields continue working unchanged (no committed
node uses them any more; imported nodes are Cartesian). Records can use a
discriminated `position`:

```ts
position: { kind: "polar", angle: 15, distance: 120 }
// Or normalized app units, relative to the center of the tree:
position: { kind: "cartesian", x: -96, y: 358 }
```

An explicit `position` takes precedence over legacy fields. Positive X is
right; positive Y is down. Both formats use the same icon, badge and interaction
renderer. `resolveNodePosition` preserves the old polar icon centers, including
the rotated wrapper's 2px offset. Cartesian coordinates are exact icon centers;
they do not receive that compatibility offset. Angle zero is valid.

Base paths target stable per-node IDs, not angles. An optional
`baseAnchor: { x, y }` supplies a normalized game-root endpoint. Otherwise the
endpoint is projected radially onto the existing 198-unit circle. The decorative
circle and class labels remain authored (Warrior and Ranger moved outward to
clear the imported layout). No saved IDs,
skill costs, level behavior or graph adjacency were changed.

## Metadata adapter (implemented)

The toolkit exports schema 1.0.0 JSON with raw resources, interpreted text
templates, typed effects and provenance. Do not replace this app's nodes with
export-order IDs: existing saved/shared builds depend on the current IDs.

Run from this repository with a validated export from enshrouded-tools:

```powershell
# Preview only: writes ignored .local/skill-data/{report,candidate}.json,
# summary.md and changes.proposed.json
yarn import-skills 'C:\path\to\skill-data.json'
# Apply after reviewing the report (and approving any structural changes):
yarn import-skills 'C:\path\to\skill-data.json' --apply
```

`scripts/skill-data-mapping.json` is the checked identity record:
`nodes` maps stable game IDs to app IDs/type keys, and `retired` keeps app IDs
removed by game updates so they are never reused. Imports match by game ID
through this mapping; name and neighbor matching only initializes a mapping
(`--initialize-mapping`) or suggests types for unseen game IDs. The one
explicit alias is game Healing Revive -> the placed `HEALER_REVIVE` type. All
269 skill edges and 21 base connections agreed with the former authored graph
for build 1076226 when it moved into generated data.

`gameSkillData.json` is the source of node membership, types, positions, base
links (`base`, `baseAnchor`) and edges. Edges are stored once as undirected
`[low, high]` app-ID pairs; the game's links are directed, but `Nodes.ts`
expands every pair into adjacency on both endpoints, so a skill unlocks from
whichever neighbor is selected first. `LegacyNodes.ts` holds only app-owned
presentation: type colors, icons/assets and fallback text, plus per-node
`tier`. `Nodes.ts` merges the two and rejects edges to unknown nodes or types
without authored presentation. Only types used by a node are part of the tree.
The coordinate center is the average of the 12 game roots; scale fits their
mean radius to 198 app units. The transform and original game provenance are
retained in generated JSON.

The same import writes English text to each locale record's `game` section.
Descriptions are stored once as i18next templates. Numeric substitutions live
in app metadata: `gameValues` for constants, `gameLevelValues` for values that
change with purchased level, and `gamePerLevelValues` for the per-level label.
Per-level labels have a separate template, so old interpolation cannot
overwrite imported values. Original
locale fields and French text remain intact. Imported text still passes through
DOMPurify. `scripts/skill-data-inputs.json` contains app-owned action labels,
not claimed game bindings; `--inputs=path.json` can supply different labels.

Supported numeric configs are Float/Sint32/Uint32, constants and Linear
Self/Level scaling; normal, percentage and numeric-seconds duration formats.
Balancing IDs 0/1/2 resolve Health/Mana/Stamina per attribute point. Unknown
formats, sources, IDs and placeholder mismatches prevent applying an import.

Two explicit compatibility exceptions remain in the report:

- Frost retains its existing authored text because `ScaledTimeImpactConfig`
  evaluation is not verified. Its existing 3/6/9 seconds is **not** asserted as
  newly confirmed game data. Resolve the game's time-scaling semantics before
  removing this exception.
- Ranger retains its authored DEX/ENDURANCE contribution; its effect program
  is not decoded into a stat calculation. Other non-basic combat effects are
  not added to the stat totals.

Costs/max levels are unchanged for this build. Generated JSON and English
locale changes belong in source control; raw game exports and local reports do
not. Regenerate both outputs with the command, not by hand. No new PNG assets
are copied: current asset names and presentation overrides remain in use.

## Tree versioning

The checked import records the source game build and a SHA-256 revision of the
imported nodes (positions, types, base links), edges, type metadata and English
text. This content revision
ignores export timestamps, parser provenance and JSON key order; it changes
when the imported tree changes. The app shows the game update/build and short
revision in Settings, plus the update on wider tree layouts. This is distinct
from the app's package version. New share codes and JSON builds carry the full
content hash. Older unversioned builds still import; a build bearing a
different hash imports with a warning, since its IDs/levels may need review.

This is version identification, **not** a historical tree selector. Rendering
an older tree would require retaining its complete nodes, edges, assets and
translations as a separately selectable snapshot, plus migration rules for
builds. That can be added after the update workflow is reviewed.

## Structural changes in game updates (implemented)

A preview never aborts on structural differences. It compares the export with
the checked mapping and the previous import by stable game ID, then writes
`report.json`, a readable `summary.md`, and `changes.proposed.json`:

- **Added** game IDs: proposed new app IDs (one above the highest active or
  retired ID) and type keys (an existing type when the name matches, else
  UPPER_SNAKE of the name). A game ID that was retired before is proposed to
  restore its old app ID.
- **Removed** game IDs: proposed for retirement. A removed and an added ID with
  the same name are proposed as a **re-ID** (`reassign`), keeping the app ID,
  so saved builds continue working.
- **Renamed** nodes (same game ID, new name) are reported; their English text
  updates without a decision. If nodes sharing a type diverge, the report lists
  `typeConflicts`; give one node a new type with `retype`.
- **Graph** changes: added/removed edges and base links, in app-ID space.

`--apply` is refused while any blocker remains. Structural or graph changes
need a reviewed `.local/skill-data/changes.json` (or `--changes=path`). Start
from `changes.proposed.json`, edit decisions if needed, and rerun the preview
until it is clean. Approvals are tied to the export's game build, and the graph
section must match the computed graph exactly, so a stale approval cannot apply.
A successful apply renames the file to `changes.applied.json`.

```json
{
  "gameBuild": "<from the export>",
  "add": { "<new game ID>": { "appId": "223", "type": "NEW_SKILL" } },
  "reassign": { "<new game ID>": "<removed game ID>" },
  "remove": ["<removed game ID>"],
  "retype": { "<game ID>": "NEW_TYPE" },
  "graph": { "added": [], "removed": [], "baseAdded": [], "baseRemoved": [] }
}
```

New types also need authored presentation in `LegacyNodes.ts` (at least a
`color`; `hasIcon` plus `public/assets/skills/<TYPE>.png` and `_GRAY.png`
for an icon). Apply is refused until it exists. A new node without an
authored `tier` renders as small (a warning). Game text is English only, so
apply is also refused until every locale has a translation (at least a
`description`) for the new type, matching `validate-translations.js`, which
requires one at build time. Apply then adds the English `game` text.

Saved and shared builds are fitted to the current tree when loaded (share
code, JSON import, or a restored session): retired IDs, skills no longer
connected to a base node, and levels above a lowered max level are removed or
clamped, and the user is told which skills changed. Retired IDs keep their
English name in generated `retired` data for that message.

`scripts/skill-data-structure.test.mjs` covers additions (new and existing
types), removals and retired IDs, re-IDs, returning IDs, renames, shared-type
conflicts, edge and base-link changes, and two-way edges. It uses a synthetic
export rebuilt from the committed data (`scripts/fixtures/synthetic-export.mjs`).

## Agentic update skill

The full game-update workflow is the `enshrouded-game-update` skill in
enshrouded-tools (`.agents/skills/`, with a `.claude/skills/` wrapper). It
reads this document, so the structural review steps above apply to it.

Detailed source findings and examples are in the toolkit's
[metadata assessment](https://github.com/rossicler/enshrouded-tools/blob/main/docs/skill-metadata-assessment.md)
and [positioning decision](https://github.com/rossicler/enshrouded-tools/blob/main/docs/positioning-decision.md).

Run `yarn test` and `yarn tsc --noEmit --incremental false` for regression and
type checks. The positioning tests cover legacy polar records, explicit polar
and Cartesian positions, base endpoints and invalid coordinates. Browser visual
checks are also needed before shipping a new imported layout.

For the optional full-source integration check:

```powershell
$env:SKILL_DATA_EXPORT = 'C:\path\to\skill-data.json'
yarn test
```
