const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

// ---- input -------------------------------------------------
const raw = process.env.VERSION;
if (!raw) {
  console.error("VERSION env var is required");
  process.exit(1);
}

const ver = raw.startsWith("v") ? raw.slice(1) : raw;

if (!/^\d+\.\d+\.\d+$/.test(ver)) {
  console.error(`Invalid VERSION: ${raw}`);
  process.exit(1);
}

const [major, minor] = ver.split(".");
const mm = `${major}.${minor}`;

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

makeVersioned({ src, version: ver }); // 1.2.3 -> sentrie@1_2_3.rb
makeVersioned({ src, version: mm }); // 1.2    -> sentrie@1.2.rb
makeVersioned({ src, version: major }); // 1   -> sentrie@1.rb

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
  const tokenSuffix = version.replace(/\./g, "_"); // file + token uses underscores
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
