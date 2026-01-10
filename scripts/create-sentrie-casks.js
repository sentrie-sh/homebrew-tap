import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// ---- input -------------------------------------------------
const raw = process.env.VERSION;
if (!raw) {
  console.error("VERSION env var is required");
  process.exit(1);
}

// Accept "v1.2.3" or "1.2.3"
const ver = raw.startsWith("v") ? raw.slice(1) : raw;

// Basic validation (fail early if tag is weird)
if (!/^\d+\.\d+\.\d+$/.test(ver)) {
  console.error(`Invalid VERSION: ${raw}`);
  process.exit(1);
}

// Derived versions
const [major, minor] = ver.split(".");
const mm = `${major}.${minor}`;

// ---- paths -------------------------------------------------
const baseDir = join(process.cwd(), "Casks");

// ---- sanity checks ----------------------------------------
if (!existsSync(baseDir)) {
  console.error(`base dir not found: ${baseDir}`);
  process.exit(1);
}

// ---- source file ------------------------------------------
const srcPath = join(baseDir, "sentrie.rb");

if (!existsSync(srcPath)) {
  console.error(`source cask not found: ${srcPath}`);
  process.exit(1);
}

const src = readFileSync(srcPath, "utf8");

// ---- helpers -----------------------------------------------
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
  const tokenSuffix = version.replace(/\./g, "_");
  const binSuffix = version;

  const dstPath = join(baseDir, `sentrie@${tokenSuffix}.rb`);
  let text = src;

  // 1) cask token
  const tokenNeedle = 'cask "sentrie" do';
  const tokenReplacement = `cask "sentrie_AT_${tokenSuffix}" do`;
  let r1 = replaceFirst(text, tokenNeedle, tokenReplacement);
  text = r1.out;

  // 2) binary target (keep dots)
  const binNeedle = '  binary "sentrie"';
  const binReplacement = `  binary "sentrie", target: "sentrie@${binSuffix}"`;
  let r2 = replaceFirst(text, binNeedle, binReplacement);
  text = r2.out;

  if (!r1.changed || !r2.changed) {
    console.error(`failed to rewrite cask for sentrie@${tokenSuffix}`);
    process.exit(1);
  }

  writeFileSync(dstPath, text, "utf8");
  console.log(`wrote ${dstPath}`);
}

// ---- generate casks ----------------------------------------
makeVersioned({
  src,
  version: ver, // e.g. 1.2.3
});
makeVersioned({
  src,
  version: mm, // e.g. 1.2
});
makeVersioned({
  src,
  version: major, // e.g. 1
});
