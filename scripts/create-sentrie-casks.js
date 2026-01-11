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

const baseDir = join(process.cwd(), "Casks");
const tmplPath = join(baseDir, "sentrie.rb.tmpl");
if (!existsSync(tmplPath)) {
  console.error(`template not found: ${tmplPath}`);
  process.exit(1);
}

const src = readFileSync(tmplPath, "utf8");

// Remove template so it never gets committed
unlinkSync(tmplPath);

// Always: publish the full version (prerelease or stable)
makeVersioned({ src, version: ver });

// Stable: publish default + major/minor channels
if (!prerelease) {
  writeFileSync(join(baseDir, "sentrie.rb"), src, "utf8");
  makeVersioned({ src, version: mm });
  makeVersioned({ src, version: major });
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

function makeVersioned({ src, version }) {
  const tokenSuffix = version
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const dstPath = join(baseDir, `sentrie@${tokenSuffix}.rb`);
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

  writeFileSync(dstPath, text, "utf8");
}
