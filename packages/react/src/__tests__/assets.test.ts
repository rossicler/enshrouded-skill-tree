import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SkillNodes, TREE_LABELS } from "@enshrouded/core";

import { getNodeArt, type NodeState } from "../art";
import { buildTreeLayout } from "../layout";
import { uiText, uiTextResources } from "../text";
import { ASSETS_DIR, syncAssets } from "../../scripts/sync-assets.mjs";

const exists = (rel: string) => fs.existsSync(path.join(ASSETS_DIR, rel));

describe("node art", () => {
  it("exists for every node in every state", () => {
    const missing = new Set<string>();
    for (const node of Object.values(SkillNodes.nodes)) {
      for (const state of ["locked", "selectable", "selected"] as NodeState[]) {
        const art = getNodeArt(node, state);
        for (const file of [art.frame, art.icon]) if (file && !exists(file)) missing.add(`${node.type} (${state}): ${file}`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it("covers the tree labels, the sounds, the tooltip, the panels and the UI kit", () => {
    const files = [
      ...TREE_LABELS.map((label) => `labels/${label.asset}.png`),
      ...["node-hover", "node-out-of-range", "node-refund", "node-select", "node-unlock"].map((name) => `sounds/${name}.mp3`),
      "ui/skill_point.png",
      "ui/skill_point_hud.png",
      "ui/flame.png",
      "decorations/bg-circles-tiled.svg",
      "decorations/divider.svg",
      "decorations/button-decoration.svg",
      ...["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => `decorations/modal-${corner}.svg`),
    ];
    expect(files.filter((file) => !exists(file))).toEqual([]);
  });
});

describe("sync-assets", () => {
  it("copies the assets, skips unchanged files and removes stale ones", () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), "skill-tree-assets-"));
    try {
      fs.writeFileSync(path.join(dest, "stale.png"), "old");
      const first = syncAssets(dest);
      expect(first.copied).toBe(first.files);
      expect(first.removed).toBe(1);
      expect(fs.readFileSync(path.join(dest, "ui/skill_point.png"))).toEqual(fs.readFileSync(path.join(ASSETS_DIR, "ui/skill_point.png")));
      expect(syncAssets(dest)).toEqual({ files: first.files, copied: 0, removed: 0 });
    } finally {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });
});

describe("layout", () => {
  it("centers the tree in a whole-pixel box with the pan margin", () => {
    const layout = buildTreeLayout();
    expect(Number.isInteger(layout.halfExtent.x) && Number.isInteger(layout.halfExtent.y)).toBe(true);
    expect(layout.links.filter((l) => l.kind === "base")).toHaveLength(Object.values(SkillNodes.nodes).filter((n) => n.base).length);
  });

  // The tree is rendered on the server and hydrated in the browser, whose
  // Math.sin/cos may differ in the last bit. The layout must not.
  it("doesn't change when sin and cos differ in the last bit", () => {
    const expected = buildTreeLayout();
    const { sin, cos } = Math;
    try {
      Math.sin = (x) => sin(x) * (1 + Number.EPSILON);
      Math.cos = (x) => cos(x) * (1 - Number.EPSILON);
      expect(buildTreeLayout()).toEqual(expected);
    } finally {
      Math.sin = sin;
      Math.cos = cos;
    }
  });
});

describe("ui text", () => {
  const keys = (o: object, prefix = ""): string[] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`)));

  it("has the same keys in every locale", () => {
    for (const messages of Object.values(uiTextResources)) expect(keys(messages).sort()).toEqual(keys(uiTextResources.en).sort());
  });

  it("interpolates and falls back to English", () => {
    expect(uiText("fr", "tooltip.levelHeader", { current: 1, max: 3 })).toBe("Niveau 1 / 3");
    expect(uiText("fr-CA", "tooltip.unlock")).toBe("Déverrouiller");
    expect(uiText("de", "tooltip.unlock")).toBe("Unlock");
  });
});
