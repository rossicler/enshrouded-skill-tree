// Checks that every locale has the text the app shows or searches:
// - nodes.json: for each skill type in the tree, the record the locale shows
//   (the English `game` section or the locale's own text, per skillTextPrefix)
//   has a name and description, every {{placeholder}} has a value at every
//   level, and the per-level line is in the locale's language. The tooltip,
//   search, toasts and the ?focus= search all read these records.
// - common.json: every locale has the same keys and placeholders as the
//   default locale, every key the code references exists, and keys built at
//   runtime (biomes.<id>, treeLabels.<nameKey>) exist for every value.
const fs = require('fs');
const path = require('path');
const { z } = require('zod');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const localesDir = path.join(root, 'public/locales');

const nodeTranslationSchema = z.object({
    name: z.string().min(1, "Name must be a non-empty string when present").optional(),
    description: z.array(z.string()).min(1, "Description must be a non-empty array of strings"),
    // Per-level line for types that show this record instead of game text.
    perLevelLabel: z.string().min(1).optional(),
    game: z.object({
        name: z.string().min(1),
        description: z.array(z.string()).min(1),
        perLevelLabel: z.string().optional(),
    }).strict().optional(),
}).strict(); // Disallow extra keys to keep translation files lean

const nodesJsonSchema = z.record(z.string(), nodeTranslationSchema);

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

// Names in {{name}}, {{name, format}} and {{- name}}.
const placeholders = (text) =>
    [...new Set([...String(text).matchAll(/{{\s*-?\s*([\w.]+)[^}]*}}/g)].map((m) => m[1]))].sort();

const flatten = (object, prefix = '') =>
    Object.entries(object).flatMap(([key, value]) =>
        value && typeof value === 'object' && !Array.isArray(value)
            ? flatten(value, `${prefix}${key}.`)
            : [[`${prefix}${key}`, value]]);

// common.json keys with plural forms (_one, _other, ...) merged, mapped to all their texts.
const commonKeys = (common) => {
    const keys = new Map();
    for (const [key, value] of flatten(common)) {
        const base = key.replace(PLURAL_SUFFIX, '');
        keys.set(base, [...(keys.get(base) ?? []), ...[].concat(value)]);
    }
    return keys;
};

function collectProblems({
    locales,
    defaultLocale,
    tree,
    presentationTypes,
    usesGameText,
    interpolation,
    families,
    references,
}) {
    const problems = [];
    const report = (file, message) => problems.push({ file, message });
    const unresolved = (text, values) => placeholders(text).filter((name) => values[name] == null);
    const list = (names) => names.map((name) => `{{${name}}}`).join(', ');

    for (const [lang, { nodes }] of Object.entries(locales)) {
        const file = `${lang}/nodes.json`;
        const parsed = nodesJsonSchema.safeParse(nodes);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) report(file, `[${issue.path.join('.')}] ${issue.message}`);
        }
        for (const type of presentationTypes) {
            if (!nodes[type]) report(file, `${type} is missing (every type authored in LegacyNodes.ts needs an entry)`);
        }

        for (const [type, meta] of Object.entries(tree.types)) {
            if (!nodes[type]) continue; // reported above
            const game = usesGameText(meta, lang);
            const key = game ? `${type}.game` : type;
            const record = game ? nodes[type].game : nodes[type];
            if (!record) {
                report(file, `${key} is missing, so the tooltip and search would have no text`);
                continue;
            }
            if (!record.name) {
                report(file, `${key}.name is missing, so the tooltip, search and toasts would show the type key`);
            }
            if (record.description?.length) {
                const values = game ? interpolation.game : interpolation.skill;
                for (let level = 1; level <= (meta.maxLevel ?? 1); level++) {
                    const missing = unresolved(record.description.join('\n'), values(meta, level));
                    if (missing.length) {
                        report(file, `${key}.description uses ${list(missing)}, which has no value at level ${level}`);
                        break;
                    }
                }
            }
            // The per-level line under the description.
            if (game) {
                if (meta.gamePerLevelValues && !record.perLevelLabel) {
                    report(file, `${key}.perLevelLabel is missing, so the tooltip would show no per-level line`);
                }
                const missing = record.perLevelLabel ? unresolved(record.perLevelLabel, meta.gamePerLevelValues ?? {}) : [];
                if (missing.length) report(file, `${key}.perLevelLabel uses ${list(missing)}, which has no value`);
            } else if (meta.perLevel) {
                // Without a perLevelLabel the tooltip shows the English label authored in LegacyNodes.ts.
                if (!record.perLevelLabel && lang !== defaultLocale) {
                    report(file, `${key}.perLevelLabel is missing, so the tooltip would show the English "${meta.perLevel.label}"`);
                }
                const { value, value2 } = meta.perLevel;
                const missing = unresolved(record.perLevelLabel ?? meta.perLevel.label, { value, value2 });
                if (missing.length) report(file, `${key}.perLevelLabel uses ${list(missing)}, which has no value`);
            }
        }
    }

    const expected = commonKeys(locales[defaultLocale].common);
    const keysByLang = Object.fromEntries(
        Object.entries(locales).map(([lang, { common }]) => [lang, commonKeys(common)]));
    for (const [lang, keys] of Object.entries(keysByLang)) {
        if (lang === defaultLocale) continue;
        const file = `${lang}/common.json`;
        for (const [key, texts] of expected) {
            if (!keys.has(key)) {
                report(file, `${key} is missing (it is in ${defaultLocale}/common.json)`);
                continue;
            }
            const want = placeholders(texts.join('\n'));
            const have = placeholders(keys.get(key).join('\n'));
            if (want.join() !== have.join()) {
                report(file, `${key} uses ${list(have) || 'no placeholders'}, but ${defaultLocale} uses ${list(want) || 'none'}`);
            }
        }
        for (const key of keys.keys()) {
            if (!expected.has(key)) report(file, `${key} is not in ${defaultLocale}/common.json`);
        }
    }

    const requireKey = (key, reason) => {
        for (const [lang, keys] of Object.entries(keysByLang)) {
            if (!keys.has(key)) report(`${lang}/common.json`, `${key} is missing (${reason})`);
        }
    };
    // Literal t()/i18nKey keys, plus any string literal that names a key in a
    // common.json section (lookup tables such as StatsDialog's labels).
    const sections = new Set(Object.keys(locales[defaultLocale].common));
    const nodeTypes = new Set(Object.keys(locales[defaultLocale].nodes));
    for (const { key, file, call } of references.keys) {
        const section = key.split('.')[0];
        if (nodeTypes.has(section)) continue; // "nodes" namespace, checked above
        if (call || sections.has(section)) requireKey(key, `used in ${file}`);
    }
    for (const [prefix, values] of Object.entries(families)) {
        for (const value of values) requireKey(`${prefix}${value}`, `one key per value of ${prefix}*`);
    }
    for (const { template, file } of references.templates) {
        // `${type}.…` keys are skill text, checked above.
        if (template.startsWith('${')) continue;
        const prefix = template.slice(0, template.indexOf('${'));
        if (!(prefix in families)) {
            report(file, `t(\`${template}\`) builds keys this check can't list; list its values under families in loadApp() in scripts/validate-translations.js`);
        }
    }
    return problems;
}

// Translation keys referenced in the app source.
function scanSource(dir = srcDir) {
    const keys = [];
    const templates = [];
    const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                if (entry.name !== '__tests__') walk(full);
                continue;
            }
            if (!/\.tsx?$/.test(entry.name)) continue;
            const source = fs.readFileSync(full, 'utf8');
            const file = path.relative(root, full).split(path.sep).join('/');
            for (const m of source.matchAll(/\bt\(\s*(["'])([^"'`\n]+)\1|i18nKey=\{?\s*(["'])([^"'\n]+)\3/g)) {
                keys.push({ key: m[2] ?? m[4], file, call: true });
            }
            for (const m of source.matchAll(/(["'])([A-Za-z]\w*(?:\.\w+)+)\1/g)) {
                keys.push({ key: m[2], file, call: false });
            }
            for (const m of source.matchAll(/\bt\(\s*`([^`]*)`|i18nKey=\{\s*`([^`]*)`/g)) {
                templates.push({ template: m[1] ?? m[2], file });
            }
        }
    };
    walk(dir);
    return { keys, templates };
}

// The app's own tree, text rules and interpolation, so the check matches what renders.
function loadApp() {
    const jiti = require('jiti')(__filename, { alias: { '@': srcDir }, interopDefault: false });
    const load = (file) => jiti(path.join(srcDir, file));
    const { getGameInterpolationValues, getSkillInterpolationValues } = load('utils/skillInterpolation.ts');
    return {
        tree: load('constants/Nodes.ts').default,
        presentationTypes: Object.keys(load('constants/LegacyNodes.ts').default.types),
        usesGameText: load('utils/skillText.ts').usesGameText,
        interpolation: { game: getGameInterpolationValues, skill: getSkillInterpolationValues },
        // Keys built at runtime from a template literal: prefix -> every value it takes.
        // A t(`prefix${...}`) call with a prefix missing here fails validation.
        families: {
            'biomes.': load('constants/Biomes.ts').BIOMES.map((biome) => biome.id),
            'treeLabels.': load('constants/TreeLabels.ts').TREE_LABELS.map((label) => label.nameKey),
        },
    };
}

function main() {
    console.log('--- Validating Translations ---');
    const { i18n } = require('../next-i18next.config.js');
    const problems = [];
    const readJson = (lang, ns) => {
        const file = path.join(localesDir, lang, `${ns}.json`);
        try {
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (error) {
            problems.push({ file: `${lang}/${ns}.json`, message: error.message });
        }
    };
    const locales = Object.fromEntries(i18n.locales.map((lang) => [lang, { nodes: readJson(lang, 'nodes'), common: readJson(lang, 'common') }]));
    if (!problems.length) {
        problems.push(...collectProblems({
            locales,
            defaultLocale: i18n.defaultLocale,
            ...loadApp(),
            references: scanSource(),
        }));
    }

    if (problems.length) {
        const byFile = Map.groupBy(problems, (problem) => problem.file);
        for (const [file, list] of byFile) {
            console.error(`\n${file} (${list.length}):`);
            for (const { message } of list) console.error(`  - ${message}`);
        }
        console.error(`\n--- Validation FAILED: ${problems.length} problem(s) ---`);
        process.exit(1);
    }
    console.log('--- Validation PASSED! ---\n');
}

if (require.main === module) main();

module.exports = { collectProblems, scanSource, placeholders };
