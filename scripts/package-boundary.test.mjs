// Guards the workspace packages' boundary: they are imported by other apps,
// so they must not reach into the site (the @/ alias), Next, or browser
// globals, and core must stay free of React. A second test loads core in a
// plain Node process.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(packagesDir, entry.name, "package.json")))
  .map((entry) => {
    const dir = path.join(packagesDir, entry.name);
    return { name: entry.name, dir, manifest: JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) };
  });

const sourceFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sourceFiles(full);
  return /\.(c|m)?[jt]sx?$/.test(entry.name) ? [full] : [];
});

const isTest = (file) => /[\\/]__tests__[\\/]|\.test\.[cm]?[jt]sx?$/.test(file);

// What each package may use beyond the shared rules (no @/, no next, every
// external import declared). Core runs anywhere, servers included, so it has
// neither React nor browser globals. The React package is client code: its
// entry is marked "use client" and its effects and handlers may touch
// window/document. Unknown packages get core's strict rules.
const ALLOWANCES = {
  core: { react: false, browserGlobals: false, useClient: false },
  react: { react: true, browserGlobals: true, useClient: true },
};
const allowanceOf = (pkg) => ALLOWANCES[pkg.name] ?? ALLOWANCES.core;

// Comments and string contents removed, so prose and text don't trip the checks.
const codeOnly = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:\\])\/\/.*$/gm, "$1")
  .replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, "$1$1");

const specifiers = (source) => [
  ...source.matchAll(/\b(?:import|export)\s[^"'`;]*?\bfrom\s*["']([^"']+)["']/g),
  ...source.matchAll(/\bimport\s*["']([^"']+)["']/g),
  ...source.matchAll(/\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g),
].map((m) => m[1]);

const packageName = (specifier) => specifier.startsWith("@")
  ? specifier.split("/").slice(0, 2).join("/")
  : specifier.split("/")[0];

const violations = (pkg) => {
  const problems = [];
  const allow = allowanceOf(pkg);
  const srcDir = path.join(pkg.dir, "src");
  const deps = new Set([...Object.keys(pkg.manifest.dependencies ?? {}), ...Object.keys(pkg.manifest.peerDependencies ?? {})]);
  for (const file of sourceFiles(srcDir)) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const source = fs.readFileSync(file, "utf8");
    for (const specifier of specifiers(source)) {
      if (specifier.startsWith("@/")) problems.push(`${rel} imports "${specifier}" (the host's @/ alias)`);
      if (specifier === "next" || specifier.startsWith("next/")) problems.push(`${rel} imports "${specifier}"`);
      if (!allow.react && /^react(-dom)?(\/|$)/.test(specifier)) problems.push(`${rel} imports "${specifier}" (${pkg.name} has no React)`);
      // Other packages are imported by name, so hosts resolve them the same way.
      if (specifier.startsWith(".") && !path.resolve(path.dirname(file), specifier).startsWith(pkg.dir + path.sep)) {
        problems.push(`${rel} imports "${specifier}", outside ${pkg.manifest.name}`);
      }
      const external = !specifier.startsWith(".") && !specifier.startsWith("@/");
      const name = packageName(specifier.replace(/^node:/, ""));
      if (external && !isTest(file) && !builtinModules.includes(name) && !deps.has(name)) {
        problems.push(`${rel} imports "${specifier}", which is not a dependency of ${pkg.manifest.name}`);
      }
    }
    if (!isTest(file) && !allow.browserGlobals) {
      for (const global of ["window", "document"]) {
        if (new RegExp(`(?<![.\\w$])${global}\\b`).test(codeOnly(source))) problems.push(`${rel} uses the browser global "${global}"`);
      }
    }
  }
  const entry = pkg.manifest.main && path.join(pkg.dir, pkg.manifest.main);
  if (allow.useClient && entry && !/^\s*(\/\/[^\n]*\n\s*)*["']use client["']/.test(fs.readFileSync(entry, "utf8"))) {
    problems.push(`${pkg.manifest.main} of ${pkg.manifest.name} must start with "use client"`);
  }
  return problems;
};

describe("workspace packages", () => {
  it("include core", () => {
    expect(packages.map((pkg) => pkg.manifest.name)).toContain("@enshrouded/core");
  });

  it("include the React package", () => {
    expect(packages.map((pkg) => pkg.manifest.name)).toContain("@enshrouded/react");
  });

  it.each(packages.map((pkg) => [pkg.manifest.name, pkg]))("%s stays inside its boundary", (_name, pkg) => {
    expect(violations(pkg)).toEqual([]);
  });

  it("the React package may use React and browser globals, but needs \"use client\"", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "boundary-check-"));
    try {
      fs.mkdirSync(path.join(dir, "src"));
      fs.writeFileSync(path.join(dir, "src", "index.ts"), [
        'import { useState } from "react";',
        'import x from "../../core/src/index";',
        "export const width = () => window.innerWidth + document.body.clientWidth;",
      ].join("\n"));
      const problems = violations({ name: "react", dir, manifest: { name: "@enshrouded/react", main: "src/index.ts", peerDependencies: { react: "*" } } });
      expect(problems).toEqual([
        expect.stringContaining('imports "../../core/src/index", outside @enshrouded/react'),
        expect.stringContaining('must start with "use client"'),
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the check catches each kind of violation", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "boundary-check-"));
    try {
      fs.mkdirSync(path.join(dir, "src"));
      fs.writeFileSync(path.join(dir, "src", "bad.ts"), [
        'import x from "@/constants/Nodes";',
        'import Link from "next/link";',
        'import { useState } from "react";',
        'import _ from "lodash";',
        "// window in a comment is fine",
        'const label = "document in a string is fine";',
        "export const width = window.innerWidth + document.body.clientWidth;",
      ].join("\n"));
      const problems = violations({ name: "core", dir, manifest: { name: "@enshrouded/core", dependencies: { react: "*" } } });
      expect(problems).toEqual([
        expect.stringContaining('imports "@/constants/Nodes"'),
        expect.stringContaining('imports "next/link"'),
        expect.stringContaining("which is not a dependency"),
        expect.stringContaining('imports "react" (core has no React)'),
        expect.stringContaining('imports "lodash", which is not a dependency'),
        expect.stringContaining('browser global "window"'),
        expect.stringContaining('browser global "document"'),
      ]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("@enshrouded/core in plain Node", () => {
  it("loads without browser globals, without side effects, and works", () => {
    // jiti only compiles the TypeScript; the code runs in a plain Node process.
    const script = `
      const before = new Set(Object.getOwnPropertyNames(globalThis));
      const core = require("jiti")(${JSON.stringify(path.join(root, "package.json"))}, { interopDefault: false })(${JSON.stringify(path.join(packagesDir, "core/src/index.ts"))});
      const added = Object.getOwnPropertyNames(globalThis).filter((key) => !before.has(key));
      const [id, node] = Object.entries(core.SkillNodes.nodes).find(([, n]) => n.base);
      const code = core.encodeSkillBuild(core.selectionToBuild({ [id]: 1 }));
      console.log(JSON.stringify({
        added,
        browser: typeof window !== "undefined" || typeof document !== "undefined",
        nodes: Object.keys(core.SkillNodes.nodes).length,
        selection: core.buildToSelection(core.decodeSkillBuild(code)),
        id,
        name: core.getSkillName(node.type, "fr"),
        corpus: core.buildSearchCorpus("en").length,
        points: core.getPointsUsed({ [id]: 1 }),
      }));
    `;
    const output = JSON.parse(execFileSync(process.execPath, ["-e", script], { cwd: root, encoding: "utf8" }));
    expect(output.added).toEqual([]);
    expect(output.browser).toBe(false);
    expect(output.nodes).toBeGreaterThan(100);
    expect(output.selection).toEqual({ [output.id]: 1 });
    expect(output.name).toMatch(/\S/);
    expect(output.corpus).toBeGreaterThan(50);
    expect(output.points).toBeGreaterThan(0);
  });
});
