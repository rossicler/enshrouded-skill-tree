import type { GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import type { ReactNode } from "react";
import { getPointsUsed, type SkillSelection } from "@enshrouded/core";
import { SkillTreeCard, SkillTreeProvider, useSkillBuild } from "@enshrouded/react";

import { SKILL_TREE_ASSETS } from "@/constants/assets";

// A page of skill tree cards from @enshrouded/react at a few sizes, editable
// and read-only: a demo of embedding the tree in another page, and the page
// the card's browser tests run against. Not linked from the planner.

const SAMPLE_BUILD: SkillSelection = { "2": 3, "1": 1, "17": 1 };

type DemoCardProps = {
  id: string;
  size?: number;
  initial?: SkillSelection;
  readOnly?: boolean;
  caption: string;
};

const DemoCard = ({ id, size, initial, readOnly = false, caption }: DemoCardProps) => {
  const build = useSkillBuild(initial);
  const count = Object.keys(build.selection).length;
  return (
    <figure className="flex flex-col items-start gap-2" data-demo-card={id}>
      {/* A sized box the card fills. Without a size, the card takes its default one. */}
      <div style={size ? { width: size, height: size, maxWidth: "100%" } : undefined}>
        <SkillTreeCard
          selection={build.selection}
          onSelectionChange={build.onSelectionChange}
          readOnly={readOnly}
          label={`${caption} (${id})`}
          className="rounded-sm border border-white/15"
        />
      </div>
      <figcaption className="text-sm text-white/70">
        {caption} ·{" "}
        <span data-demo-count={id}>
          {count} skills, {getPointsUsed(build.selection)} points
        </span>
        {!readOnly && count > 0 && (
          <button type="button" className="ml-2 underline" onClick={build.reset} data-demo-reset={id}>
            reset
          </button>
        )}
      </figcaption>
    </figure>
  );
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="flex flex-wrap items-start gap-6">{children}</div>
  </section>
);

export default function CardDemo() {
  const { locale = "en" } = useRouter();
  return (
    <>
      <Head>
        <title>Skill tree cards</title>
        <meta name="robots" content="noindex" />
      </Head>
      {/* The site locks body scrolling for the planner, so this page scrolls in its own box. */}
      <div className="h-[100dvh] overflow-y-auto bg-gray-900 text-white" data-demo-scroller>
        <SkillTreeProvider locale={locale} assetBaseUrl={SKILL_TREE_ASSETS}>
          <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
            <header className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Skill tree cards</h1>
              <p className="text-white/70">
                The skill tree as a card for other pages. Drag to pan. Click a card, then use the wheel to zoom, or hold
                Ctrl. Click a skill to unlock it and right-click to refund it (on touch screens: double tap and long
                press). The buttons zoom, expand the card over the page, or show it fullscreen.
              </p>
            </header>
            <Section title="Two editable cards">
              <DemoCard id="a" size={360} caption="Card A" />
              <DemoCard id="b" size={360} initial={SAMPLE_BUILD} caption="Card B" />
            </Section>
            <Section title="Sizes">
              <DemoCard id="s280" size={280} caption="280 px" />
              <DemoCard id="s360" size={360} caption="360 px" />
              <DemoCard id="s600" size={600} caption="600 px" />
            </Section>
            <Section title="Read-only">
              <DemoCard id="ro" initial={SAMPLE_BUILD} readOnly caption="Default size" />
              <DemoCard id="ro280" size={280} initial={SAMPLE_BUILD} readOnly caption="280 px" />
            </Section>
            <p className="pb-[60vh] text-white/50" data-demo-end>
              End of the demo.
            </p>
          </main>
        </SkillTreeProvider>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
