const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { join } = require("path");

if (!process.env.PRERELEASE || !process.env.VERSION) {
  console.error("PRERELEASE and VERSION env vars are required");
  process.exit(1);
}

const raw = process.env.VERSION; // v0.0.1-test.release.build004
const prerelease = process.env.PRERELEASE === "true";
const ver = raw.startsWith("v") ? raw.slice(1) : raw;

const core = ver.split(/[-+]/)[0]; // 0.0.1
if (!/^\d+\.\d+\.\d+$/.test(core)) {
  console.error(`Invalid VERSION core: ${raw}`);
  process.exit(1);
}

const [major, minor] = core.split(".");
const mm = `${major}.${minor}`;

if (!prerelease && ver !== core) {
  console.error(`Invalid VERSION: ${raw} - stable releases must be X.Y.Z`);
  process.exit(1);
}

// Process Cask template
const caskBaseDir = join(process.cwd(), "Casks");
const caskTmplPath = join(caskBaseDir, "sentrie.rb.tmpl");
if (!existsSync(caskTmplPath)) {
  console.error(`cask template not found: ${caskTmplPath}`);
  process.exit(1);
}

const caskSrc = readFileSync(caskTmplPath, "utf8");

// Remove template so it never gets committed
unlinkSync(caskTmplPath);

// Always: publish the full version (prerelease or stable)
makeVersionedCask({ src: caskSrc, version: ver });

// Stable: publish default + major/minor channels
if (!prerelease) {
  const defaultCaskContent = removeCommentLines(caskSrc);
  writeFileSync(join(caskBaseDir, "sentrie.rb"), defaultCaskContent, "utf8");
  makeVersionedCask({ src: caskSrc, version: mm });
  makeVersionedCask({ src: caskSrc, version: major });
}

// Process Formula template
const formulaBaseDir = join(process.cwd(), "Formula");
const formulaTmplPath = join(formulaBaseDir, "sentrie.rb.tmpl");
if (existsSync(formulaTmplPath)) {
  const formulaSrc = readFileSync(formulaTmplPath, "utf8");

  // Remove template so it never gets committed
  unlinkSync(formulaTmplPath);

  // Always: publish the full version (prerelease or stable)
  makeVersionedFormula({ src: formulaSrc, version: ver });

  // Stable: publish default + major/minor channels
  if (!prerelease) {
    const defaultFormulaContent = removeCommentLines(formulaSrc);
    writeFileSync(
      join(formulaBaseDir, "sentrie.rb"),
      defaultFormulaContent,
      "utf8"
    );
    makeVersionedFormula({ src: formulaSrc, version: mm });
    makeVersionedFormula({ src: formulaSrc, version: major });
  }
}

function replaceFirst(haystack, needle, replacement) {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return { out: haystack, changed: false };
  return {
    out:
      haystack.slice(0, idx) +
      replacement +
      haystack.slice(idx + needle.length),
    changed: true,
  };
}

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

function makeVersionedCask({ src, version }) {
  const tokenSuffix = version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const dstPath = join(caskBaseDir, `sentrie@${tokenSuffix}.rb`);
  let text = src;

  const r1 = replaceFirst(
    text,
    'cask "sentrie" do',
    `cask "sentrie@${tokenSuffix}" do`
  );
  text = r1.out;

  const r2 = replaceFirst(
    text,
    '  binary "sentrie"',
    `  binary "sentrie", target: "sentrie@${version}"`
  );
  text = r2.out;

  if (!r1.changed || !r2.changed) {
    console.error(`failed to rewrite cask for sentrie@${tokenSuffix}`);
    process.exit(1);
  }

  // Remove comment lines
  text = removeCommentLines(text);

  writeFileSync(dstPath, text, "utf8");
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

function formulaClassSuffix(tokenSuffix) {
  // tokenSuffix is like "1_2_4" or "1" etc.
  const digits = tokenSuffix.replace(/[^0-9]/g, "");
  return digits.length ? digits : "0";
}
