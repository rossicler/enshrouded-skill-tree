const fs = require('fs');
const path = require('path');
const { z } = require('zod');

const nodesFile = path.join(__dirname, '../src/constants/Nodes.ts');
const localesDir = path.join(__dirname, '../public/locales');

// Define the schema for a single skill node translation
const nodeTranslationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.array(z.string()).min(1, "Description must be a non-empty array of strings"),
}).strict(); // Disallow extra keys to keep translation files lean

// Define the schema for the entire nodes.json file
const nodesJsonSchema = z.record(z.string(), nodeTranslationSchema);

console.log('--- Validating Translations with Zod ---');

if (!fs.existsSync(nodesFile)) {
    console.error(`Error: Nodes file not found at ${nodesFile}`);
    process.exit(1);
}

const content = fs.readFileSync(nodesFile, 'utf8');
const nodeKeysMatch = content.matchAll(/^\s+([A-Z0-9_]+): \{/gm);
const nodeKeys = Array.from(nodeKeysMatch).map(m => m[1]);

if (nodeKeys.length === 0) {
    console.warn('Warning: No node keys found in Nodes.ts. Check the regex parser.');
}

const locales = ['en', 'fr'];
let hasError = false;

locales.forEach(lang => {
    const jsonPath = path.join(localesDir, lang, 'nodes.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`Error: Locale ${lang} not found at ${jsonPath}`);
        hasError = true;
        return;
    }

    let rawJson;
    try {
        rawJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
        console.error(`Error: Failed to parse ${lang}/nodes.json: ${e.message}`);
        hasError = true;
        return;
    }

    // 1. Validate General Structure using Zod
    console.log(`Validating ${lang}/nodes.json structure...`);
    const parseResult = nodesJsonSchema.safeParse(rawJson);

    if (!parseResult.success) {
        console.error(`Error: Invalid structure in ${lang}/nodes.json`);
        parseResult.error.issues.forEach(issue => {
            console.error(`  - [${issue.path.join('.')}] ${issue.message}`);
        });
        hasError = true;
    }

    // 2. Validate completeness (Keys in Nodes.ts vs Keys in JSON)
    nodeKeys.forEach(key => {
        if (!rawJson[key]) {
            console.error(`Error: Missing key "${key}" in ${lang}/nodes.json`);
            hasError = true;
        }
    });
});

if (hasError) {
    console.error('\n--- Validation FAILED! ---');
    process.exit(1);
}

console.log('--- Validation PASSED! ---\n');
process.exit(0);
