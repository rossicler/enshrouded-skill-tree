const fs = require("fs");
const path = require("path");

const { version } = require("../package.json");
const outPath = path.join(__dirname, "../src/constants/version.ts");

const content = `// Auto-generated from package.json — do not edit manually.
// Run "node scripts/generate-version.js" or build to regenerate.
export const APP_VERSION = "${version}";
`;

fs.writeFileSync(outPath, content, "utf-8");
console.log(`version.ts generated (v${version})`);
