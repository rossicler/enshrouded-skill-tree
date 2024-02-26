export const BasicStats = {
  DEX: {
    name: "Dexterity",
  },
  ENDURANCE: {
    name: "Endurance",
  },
  STR: {
    name: "Strength",
  },
  CONS: {
    name: "Constitution",
  },
  INT: {
    name: "Intelligence",
  },
  SPIRIT: {
    name: "Spirit",
  },
};

export type StatsType = keyof typeof BasicStats;
export type NodeStatsType = {
  [key in StatsType]?: number;
};
