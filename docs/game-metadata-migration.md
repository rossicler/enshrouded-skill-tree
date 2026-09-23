# Game metadata migration

## Positioning (implemented)

Existing `angle` / `distance` seed records continue working unchanged. New
records can use a discriminated `position`:

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
# Preview only: writes ignored .local/skill-data/{report,candidate}.json
yarn import-skills 'C:\path\to\skill-data.json'
# Apply after reviewing the report:
yarn import-skills 'C:\path\to\skill-data.json' --apply
```

`scripts/skill-data-mapping.json` preserves all 222 app IDs/type keys. Names and
neighbor topology establish candidate identities; the persisted mapping and
exact graph equivalence are checked on subsequent imports. The one explicit
alias is game Healing Revive -> the placed `HEALER_REVIVE` type. All 269 skill
edges and 21 base connections agree for build 1076226. Unknown placements or
topology changes fail rather than silently renumbering saved builds.

`LegacyNodes.ts` retains authored seed data, presentation/asset overrides and
graph behavior. `Nodes.ts` overlays generated positions, costs, levels and
verified basic stat increments from `gameSkillData.json`. The coordinate center
is the average of the 12 game roots; scale fits their mean radius to 198 app
units. The transform and original game provenance are retained in generated JSON.

The same import writes English text to each locale record's `game` section.
Descriptions are evaluated at every purchased level; per-level labels are
separate, so old interpolation cannot overwrite imported values. Original
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

Detailed source findings and examples are in the toolkit's
[metadata assessment](https://github.com/rossicler/enshrouded-tools/blob/main/docs/skill-metadata-assessment.md)
and [positioning decision](https://github.com/rossicler/enshrouded-tools/blob/main/docs/positioning-decision.md).

Run `yarn test` and `yarn tsc --noEmit --incremental false` for regression and
type checks. The positioning tests cover the current polar seed, explicit polar
and Cartesian positions, base endpoints and invalid coordinates. Browser visual
checks are also needed before shipping a new imported layout.

For the optional full-source integration check:

```powershell
$env:SKILL_DATA_EXPORT = 'C:\path\to\skill-data.json'
yarn test
```
