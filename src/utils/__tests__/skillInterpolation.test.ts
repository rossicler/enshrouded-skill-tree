import { describe, expect, it } from "vitest";

import { NodeTypeMetadata } from "@/constants/Nodes";
import { getSkillInterpolationValues } from "../skillInterpolation";

const base: NodeTypeMetadata = {
  description: [],
  color: "green",
  cost: 1,
};

describe("getSkillInterpolationValues", () => {
  it("returns empty object without levelValues or perLevel", () => {
    expect(getSkillInterpolationValues(base, 1)).toEqual({});
    expect(getSkillInterpolationValues(undefined, 1)).toEqual({});
  });

  it("picks the per-level value from levelValues", () => {
    const meta = { ...base, levelValues: { value: [10, 20, 30] } };
    expect(getSkillInterpolationValues(meta, 1)).toEqual({ value: 10 });
    expect(getSkillInterpolationValues(meta, 3)).toEqual({ value: 30 });
  });

  it("falls back to the last levelValues entry when level exceeds the array", () => {
    const meta = { ...base, levelValues: { value: [10, 20] } };
    expect(getSkillInterpolationValues(meta, 5)).toEqual({ value: 20 });
  });

  it("multiplies numeric perLevel values by the display level", () => {
    const meta = {
      ...base,
      perLevel: { value: 5, value2: 2, label: "x" },
    };
    expect(getSkillInterpolationValues(meta, 3)).toEqual({
      value: 15,
      value2: 6,
    });
  });

  it("passes through non-numeric perLevel values", () => {
    const meta = { ...base, perLevel: { value: "5-10", label: "x" } };
    expect(getSkillInterpolationValues(meta, 2)).toEqual({ value: "5-10" });
  });
});
