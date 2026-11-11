// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { getSkillName, loadSkillText } from "@enshrouded/core";

import { SkillTreeProvider, useSkillTreeSettings } from "../SkillTreeProvider";

afterEach(cleanup);

// Shows the provider's locale and a skill name in it.
const Probe = () => {
  const { locale } = useSkillTreeSettings();
  return <span data-testid="probe">{`${locale}|${getSkillName("DOUBLE_JUMP", locale)}`}</span>;
};

describe("SkillTreeProvider skill text", () => {
  it("renders English until a locale's text loads, then that locale", async () => {
    const { getByTestId } = render(
      <SkillTreeProvider locale="ko">
        <Probe />
      </SkillTreeProvider>
    );
    await waitFor(() => expect(getByTestId("probe").textContent).toMatch(/^ko\|/));
    expect(getByTestId("probe").textContent).not.toBe(`ko|${getSkillName("DOUBLE_JUMP", "en")}`);
  });

  it("renders a preloaded locale on the first render, the same on the server", async () => {
    const skillText = await loadSkillText("pl");
    const html = renderToString(
      <SkillTreeProvider locale="pl" skillText={skillText}>
        <Probe />
      </SkillTreeProvider>
    );
    expect(html).toContain(`pl|${getSkillName("DOUBLE_JUMP", "pl")}`);
  });

  it("renders English on the first render without preloaded text, even when this process has it", async () => {
    await loadSkillText("tr");
    const html = renderToString(
      <SkillTreeProvider locale="tr">
        <Probe />
      </SkillTreeProvider>
    );
    // What a browser that hasn't loaded Turkish yet renders while hydrating.
    expect(html).toContain(`en|${getSkillName("DOUBLE_JUMP", "en")}`);
  });

  it("ignores preloaded text for another locale", async () => {
    const skillText = await loadSkillText("it");
    const html = renderToString(
      <SkillTreeProvider locale="uk" skillText={skillText}>
        <Probe />
      </SkillTreeProvider>
    );
    expect(html).toContain("en|");
  });
});
