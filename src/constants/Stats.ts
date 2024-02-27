export const BasicStats = {
  CONS: {
    name: "Constitution",
  },
  STR: {
    name: "Strength",
  },
  ENDURANCE: {
    name: "Endurance",
  },
  DEX: {
    name: "Dexterity",
  },
  SPIRIT: {
    name: "Spirit",
  },
  INT: {
    name: "Intelligence",
  },
};

export type StatsType = keyof typeof BasicStats;
export type NodeStatsType = {
  [key in StatsType]?: number;
};
