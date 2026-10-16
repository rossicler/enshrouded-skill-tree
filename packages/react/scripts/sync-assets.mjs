#!/usr/bin/env node
// Copies the skill tree's art and sounds (packages/react/assets) into a host
// app's public folder, so they are served at the URL the host passes to
// <SkillTreeProvider assetBaseUrl>. Run it before `dev` and `build`:
//
//   node <path to packages/react>/scripts/sync-assets.mjs public/skill-tree
//
// The destination is owned by this script: files that are no longer in the
// package are removed, and unchanged files are left alone. Keep it out of git.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ASSETS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets");

const listFiles = (dir, base = dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full)];
      })
    : [];

const sameFile = (a, b) => {
  if (!fs.existsSync(b)) return false;
  const [sa, sb] = [fs.statSync(a), fs.statSync(b)];
  return sa.size === sb.size && fs.readFileSync(a).equals(fs.readFileSync(b));
};

export function syncAssets(destination, { log = () => {} } = {}) {
  const dest = path.resolve(destination);
  if (dest === ASSETS_DIR || dest.startsWith(ASSETS_DIR + path.sep)) {
    throw new Error("The destination must be outside the package's assets folder");
  }
  const wanted = new Set(listFiles(ASSETS_DIR));
  let copied = 0;
  let removed = 0;
  for (const rel of wanted) {
    const from = path.join(ASSETS_DIR, rel);
    const to = path.join(dest, rel);
    if (sameFile(from, to)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
  }
  for (const rel of listFiles(dest)) {
    if (wanted.has(rel)) continue;
    fs.rmSync(path.join(dest, rel));
    removed++;
  }
  log(`skill tree assets: ${wanted.size} files in ${path.relative(process.cwd(), dest) || "."} (${copied} copied, ${removed} removed)`);
  return { files: wanted.size, copied, removed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [destination] = process.argv.slice(2);
  if (!destination) {
    console.error("usage: sync-assets.mjs <destination folder, e.g. public/skill-tree>");
    process.exit(1);
  }
  syncAssets(destination, { log: console.log });
}
