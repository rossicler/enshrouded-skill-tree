import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { BIOMES, MAX_PLAYER_LEVEL, getPointsUsed, type SkillSelection } from "@enshrouded/core";
import {
  PointsPanel,
  SkillSearch,
  SkillTreeCard,
  SkillTreeProvider,
  StatsButton,
  StatsList,
  usePoints,
  useSkillBuild,
  useSkillSearch,
  useStats,
  type SkillTreeCardHandle,
} from "@enshrouded/react";

import { SKILL_TREE_ASSETS } from "@/constants/assets";

// A page of skill tree cards from @enshrouded/react at a few sizes, editable
// and read-only, plus a card wired to the points panel, stats and search
// through the package's hooks: a demo of embedding the tree in another page,
// and the page the card's browser tests run against. Not linked from the
// planner.

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

const ALL_BIOMES = BIOMES.map((biome) => biome.id);

// A card with the points panel, stats and search, all fed from local state
// through the hooks: what another app would write to embed a small planner.
const WiredDemo = ({ locale }: { locale: string }) => {
  const build = useSkillBuild(SAMPLE_BUILD);
  const [flameLevel, setFlameLevel] = useState(1);
  const [playerLevel, setPlayerLevel] = useState(MAX_PLAYER_LEVEL);
  const [biomes, setBiomes] = useState(ALL_BIOMES);
  const [query, setQuery] = useState("");
  const points = usePoints(build.selection, { playerLevel, biomes });
  const stats = useStats(build.selection, flameLevel);
  const search = useSkillSearch(query, locale);
  const cardRef = useRef<SkillTreeCardHandle>(null);
  const focusNode = useCallback((nodeId: string) => cardRef.current?.focusNode(nodeId, { showTooltip: true }), []);

  return (
    <div className="flex flex-wrap items-start gap-6" data-demo-wired>
      <figure className="flex flex-col items-start gap-2" data-demo-card="wired">
        <div style={{ width: 360, height: 360, maxWidth: "100%" }}>
          <SkillTreeCard
            ref={cardRef}
            selection={build.selection}
            onSelectionChange={build.onSelectionChange}
            highlightedTypes={search.highlightedTypes}
            label="Wired card"
            className="rounded-sm border border-white/15"
          />
        </div>
        <figcaption className="text-sm text-white/70">
          <span data-demo-points-left>{points.left}</span> points left
          {points.over && <span className="ml-2 text-red-300">(over budget)</span>}
          <button type="button" className="ml-2 underline" onClick={build.reset} data-demo-reset="wired">
            reset
          </button>
        </figcaption>
      </figure>
      {/* The panels' corner ornaments reach outside them from the md breakpoint up, hence the padding. */}
      <div className="flex w-[340px] max-w-full flex-col gap-4 md:px-6">
        <SkillSearch
          query={query}
          onQueryChange={setQuery}
          results={search.results}
          onFocusNode={focusNode}
          look="decorated"
        />
        <PointsPanel
          pointsUsed={points.used}
          maxPoints={points.max}
          flameLevel={flameLevel}
          onFlameLevelChange={setFlameLevel}
          playerLevel={playerLevel}
          biomes={biomes}
          onPlayerLevelChange={setPlayerLevel}
          onBiomesChange={setBiomes}
          className="md:mt-6"
        />
        <div className="rounded-sm bg-black/30 p-3 text-[#c0b89a]" data-demo-stats>
          <StatsList stats={stats} />
        </div>
        <StatsButton stats={stats} className="self-start" />
      </div>
    </div>
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
                press). The buttons zoom, expand the card over the page, or show it fullscreen. The last card is wired
                to the points panel, stats and search through the package's hooks.
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
            <Section title="With points, stats and search">
              <WiredDemo locale={locale} />
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

// Local only: `next dev` shows it, and so does a production server started
// with SKILL_TREE_DEMO_PAGES=1 (the browser tests do that). Deployed sites
// don't set it, so the page is a 404 there.
const demoPagesEnabled = () =>
  process.env.NODE_ENV === "development" || process.env.SKILL_TREE_DEMO_PAGES === "1";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  if (!demoPagesEnabled()) return { notFound: true };
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  };
};
