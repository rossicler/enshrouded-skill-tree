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
circle and class labels retain their authored positions for now. No saved IDs,
skill costs, level behavior or graph adjacency were changed.

## Metadata adapter (remaining)

The toolkit exports schema 1.0.0 JSON with raw resources, interpreted text
templates, typed effects and provenance. Do not replace this app's nodes with
export-order IDs: existing saved/shared builds depend on the current IDs.

1. Persist a checked game-node-ID to app-node-ID/type-key mapping. Repeated
   attribute names need topology/placement matching, not just name matching.
2. Validate all non-root placements and root/skill connections. Preserve the
   app's undirected selection behavior until game link flags are understood.
3. Resolve typed description arguments, balancing references and input actions;
   report unsupported cases instead of guessing numbers or keyboard bindings.
4. Generate metadata and English locale strings together. Retain manual
   presentation overrides separately and avoid silently replacing other locales.
5. Normalize raw game coordinates with an explicit center/scale transform and
   root anchors. Review bounds, labels, zoom/pan, tooltips and saved builds before
   enabling the imported layout.

Detailed source findings and examples are in the toolkit's
[metadata assessment](https://github.com/rossicler/enshrouded-tools/blob/main/docs/skill-metadata-assessment.md)
and [positioning decision](https://github.com/rossicler/enshrouded-tools/blob/main/docs/positioning-decision.md).

Run `yarn test` and `yarn tsc --noEmit --incremental false` for regression and
type checks. The positioning tests cover the current polar seed, explicit polar
and Cartesian positions, base endpoints and invalid coordinates. Browser visual
checks are also needed before shipping a new imported layout.
