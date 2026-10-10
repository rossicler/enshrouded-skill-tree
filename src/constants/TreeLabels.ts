export type TreeLabel = {
  nameKey: string;
  asset: string;
  width: number;
  height: number;
  angle: number;
  distance: number;
};

// nameKey is the treeLabels.<nameKey> key in common.json (checked by
// scripts/validate-translations.js).
export const TREE_LABELS: TreeLabel[] = [
  {
    nameKey: "trickster",
    angle: 257,
    distance: 530,
    asset: "TRICKSTER",
    width: 399,
    height: 112,
  },
  {
    nameKey: "wizard",
    angle: 286,
    distance: 700,
    asset: "WIZARD",
    width: 319,
    height: 112,
  },
  {
    nameKey: "healer",
    angle: 316,
    distance: 610,
    asset: "HEALER",
    width: 306,
    height: 112,
  },
  {
    nameKey: "battlemage",
    angle: 347,
    distance: 540,
    asset: "BATTLEMAGE",
    width: 443,
    height: 112,
  },
  {
    nameKey: "tank",
    angle: 16,
    distance: 590,
    asset: "TANK",
    width: 224,
    height: 112,
  },
  {
    nameKey: "warrior",
    angle: 50,
    distance: 710, // Presentation override: clear the imported outer nodes.
    asset: "WARRIOR",
    width: 364,
    height: 112,
  },
  {
    nameKey: "barbarian",
    angle: 78,
    distance: 670,
    asset: "BARBARIAN",
    width: 418,
    height: 112,
  },
  {
    nameKey: "athlete",
    angle: 108,
    distance: 680,
    asset: "ATHLETE",
    width: 313,
    height: 112,
  },
  {
    nameKey: "survivor",
    angle: 136,
    distance: 650,
    asset: "SURVIVOR",
    width: 379,
    height: 112,
  },
  {
    nameKey: "beastmaster",
    angle: 170,
    distance: 605,
    asset: "BEASTMASTER",
    width: 490,
    height: 112,
  },
  {
    nameKey: "ranger",
    angle: 196,
    distance: 680, // Presentation override: clear Multi Shot and its upgrades.
    asset: "RANGER",
    width: 321,
    height: 112,
  },
  {
    nameKey: "assassin",
    angle: 227,
    distance: 630,
    asset: "ASSASSIN",
    width: 369,
    height: 112,
  },
];
