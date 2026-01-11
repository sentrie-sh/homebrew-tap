const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

// ---- input -------------------------------------------------
if (!process.env.PRERELEASE || !process.env.VERSION) {
  console.error("PRERELEASE and VERSION env vars are required");
  process.exit(1);
}

const raw = process.env.VERSION;
const prerelease = process.env.PRERELEASE === "true";
const ver = raw.startsWith("v") ? raw.slice(1) : raw;

const core = ver.split(/[-+]/)[0]; // X.Y.Z
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

const baseDir = join(process.cwd(), "Casks");

if (!existsSync(baseDir)) {
  console.error(`base dir not found: ${baseDir}`);
  process.exit(1);
}

const srcPath = join(baseDir, "sentrie.rb");
if (!existsSync(srcPath)) {
  console.error(`source cask not found: ${srcPath}`);
  process.exit(1);
}

const src = readFileSync(srcPath, "utf8");

if (!prerelease) {
  // only create versioned casks if not a prerelease
  makeVersioned({ src, version: mm }); // 1.2    -> sentrie@1_2.rb
  makeVersioned({ src, version: major }); // 1   -> sentrie@1.rb
}

// always create the versioned cask for the full version
makeVersioned({ src, version: ver }); // 1.2.3 -> sentrie@1_2_3.rb

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

function makeVersioned({ src, version }) {
  const tokenSuffix = version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, ""); // file + token uses underscores

  const binSuffix = version; // binary keeps dots

  const dstPath = join(baseDir, `sentrie@${tokenSuffix}.rb`);
  let text = src;

  const tokenNeedle = 'cask "sentrie" do';
  const tokenReplacement = `cask "sentrie@${tokenSuffix}" do`;
  const r1 = replaceFirst(text, tokenNeedle, tokenReplacement);
  text = r1.out;

  const binNeedle = '  binary "sentrie"';
  const binReplacement = `  binary "sentrie", target: "sentrie@${binSuffix}"`;
  const r2 = replaceFirst(text, binNeedle, binReplacement);
  text = r2.out;

  if (!r1.changed || !r2.changed) {
    console.error(`failed to rewrite cask for sentrie@${tokenSuffix}`);
    process.exit(1);
  }

  writeFileSync(dstPath, text, "utf8");
  console.log(`wrote ${dstPath}`);
}
