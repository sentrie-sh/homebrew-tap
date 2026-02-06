const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { join } = require("path");

if (!process.env.VERSION) {
  console.error("VERSION env var is required");
  process.exit(1);
}

const raw = process.env.VERSION; // v1.2.3
const ver = raw.startsWith("v") ? raw.slice(1) : raw;

const core = ver.split(/[-+]/)[0]; // 1.2.3
if (!/^\d+\.\d+\.\d+$/.test(core)) {
  console.error(`Invalid VERSION core: ${raw}`);
  process.exit(1);
}

// Validate that this is a stable release (no prerelease or build metadata)
if (ver !== core) {
  console.error(`Invalid VERSION: ${raw} - stable releases must be X.Y.Z`);
  process.exit(1);
}

const [major, minor] = core.split(".");
const mm = `${major}.${minor}`;

// Process Formula template
const formulaBaseDir = join(process.cwd(), "Formula");
const formulaTmplPath = join(formulaBaseDir, "sentrie.rb.tmpl");
if (!existsSync(formulaTmplPath)) {
  console.error(`formula template not found: ${formulaTmplPath}`);
  process.exit(1);
}

const formulaSrc = readFileSync(formulaTmplPath, "utf8");

// Remove template so it never gets committed
unlinkSync(formulaTmplPath);

// Publish the full version
makeVersionedFormula({ src: formulaSrc, version: ver });

// Publish default + major/minor channels
const defaultFormulaContent = removeCommentLines(formulaSrc);
writeFileSync(
  join(formulaBaseDir, "sentrie.rb"),
  defaultFormulaContent,
  "utf8"
);
makeVersionedFormula({ src: formulaSrc, version: mm });
makeVersionedFormula({ src: formulaSrc, version: major });

function removeCommentLines(text) {
  // Remove lines that are entirely comments (start with #, optionally with leading whitespace)
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length === 0 || !trimmed.startsWith("#");
    })
    .join("\n");
}

function makeVersionedFormula({ src, version }) {
  const tokenSuffix = version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const dstPath = join(formulaBaseDir, `sentrie@${tokenSuffix}.rb`);

  const className = `SentrieAT${tokenSuffix}`;

  // Replace class name
  let text = src.replace(
    /^class\s+Sentrie\s+<\s+Formula/m,
    `class ${className} < Formula`
  );

  // Also rename the formula name if your template includes "class Sentrie" only.
  // Homebrew uses filename for formula name; class rename is the key piece.
  if (text === src) {
    console.error(`failed to rewrite formula class for sentrie@${tokenSuffix}`);
    process.exit(1);
  }

  // Remove comment lines
  text = removeCommentLines(text);

  writeFileSync(dstPath, text, "utf8");
}
