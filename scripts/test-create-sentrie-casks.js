#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
//
// Copyright 2025 Binaek Sarkar
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const {
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readFileSync,
} = require("fs");
const { join } = require("path");
const { execSync } = require("child_process");

const testDir = join(__dirname, "test-tmp");
const scriptPath = join(__dirname, "create-sentrie-casks.js");

// Test cases
const testCases = [
  {
    name: "Stable release - full version",
    version: "v1.2.3",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@1_2_3.rb",
      "sentrie@1_2.rb",
      "sentrie@1.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@1_2_3.rb",
      "sentrie@1_2.rb",
      "sentrie@1.rb",
    ],
  },
  {
    name: "Prerelease - full version",
    version: "v1.2.3-alpha.1",
    prerelease: "true",
    expectCasks: ["sentrie@1_2_3_alpha_1.rb"],
    expectFormulas: ["sentrie@1_2_3_alpha_1.rb"],
  },
  {
    name: "Prerelease with plus",
    version: "v0.0.2+git.abc123",
    prerelease: "true",
    expectCasks: ["sentrie@0_0_2_git_abc123.rb"],
    expectFormulas: ["sentrie@0_0_2_git_abc123.rb"],
  },
  {
    name: "Single digit version",
    version: "v5.0.0",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@5_0_0.rb",
      "sentrie@5_0.rb",
      "sentrie@5.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@5_0_0.rb",
      "sentrie@5_0.rb",
      "sentrie@5.rb",
    ],
  },
  {
    name: "Double digit version",
    version: "v10.20.30",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@10_20_30.rb",
      "sentrie@10_20.rb",
      "sentrie@10.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@10_20_30.rb",
      "sentrie@10_20.rb",
      "sentrie@10.rb",
    ],
  },
  {
    name: "Version with underscores in prerelease",
    version: "v1.0.0-test_release",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_test_release.rb"],
    expectFormulas: ["sentrie@1_0_0_test_release.rb"],
  },
  {
    name: "Version starting with zero",
    version: "v0.0.1",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@0_0_1.rb",
      "sentrie@0_0.rb",
      "sentrie@0.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@0_0_1.rb",
      "sentrie@0_0.rb",
      "sentrie@0.rb",
    ],
  },
  {
    name: "Very long prerelease version",
    version: "v1.0.0-rc.1.build.12345.commit.abcdef",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_rc_1_build_12345_commit_abcdef.rb"],
    expectFormulas: ["sentrie@1_0_0_rc_1_build_12345_commit_abcdef.rb"],
  },
  {
    name: "Version without v prefix",
    version: "2.5.8",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@2_5_8.rb",
      "sentrie@2_5.rb",
      "sentrie@2.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@2_5_8.rb",
      "sentrie@2_5.rb",
      "sentrie@2.rb",
    ],
  },
  {
    name: "Prerelease with dots and dashes",
    version: "v1.2.3-beta.1-20240101",
    prerelease: "true",
    expectCasks: ["sentrie@1_2_3_beta_1_20240101.rb"],
    expectFormulas: ["sentrie@1_2_3_beta_1_20240101.rb"],
  },
  {
    name: "Version with multiple dashes",
    version: "v2.0.0-alpha-beta-gamma",
    prerelease: "true",
    expectCasks: ["sentrie@2_0_0_alpha_beta_gamma.rb"],
    expectFormulas: ["sentrie@2_0_0_alpha_beta_gamma.rb"],
  },
  {
    name: "Version with multiple plus signs",
    version: "v1.0.0+meta+data",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_meta_data.rb"],
    expectFormulas: ["sentrie@1_0_0_meta_data.rb"],
  },
  {
    name: "Version with mixed separators",
    version: "v3.0.0-alpha.1+build.123",
    prerelease: "true",
    expectCasks: ["sentrie@3_0_0_alpha_1_build_123.rb"],
    expectFormulas: ["sentrie@3_0_0_alpha_1_build_123.rb"],
  },
  {
    name: "Version with leading/trailing separators in prerelease",
    version: "v1.0.0--alpha--",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_alpha.rb"],
    expectFormulas: ["sentrie@1_0_0_alpha.rb"],
  },
  {
    name: "Version 0.0.0 (edge case)",
    version: "v0.0.0",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@0_0_0.rb",
      "sentrie@0_0.rb",
      "sentrie@0.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@0_0_0.rb",
      "sentrie@0_0.rb",
      "sentrie@0.rb",
    ],
  },
  {
    name: "Large version numbers",
    version: "v99.99.99",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@99_99_99.rb",
      "sentrie@99_99.rb",
      "sentrie@99.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@99_99_99.rb",
      "sentrie@99_99.rb",
      "sentrie@99.rb",
    ],
  },
  {
    name: "Prerelease with numbers only",
    version: "v1.0.0-123",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_123.rb"],
    expectFormulas: ["sentrie@1_0_0_123.rb"],
  },
  {
    name: "Prerelease with letters only",
    version: "v1.0.0-abc",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_abc.rb"],
    expectFormulas: ["sentrie@1_0_0_abc.rb"],
  },
  {
    name: "Version with consecutive separators",
    version: "v1.0.0---alpha---",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_alpha.rb"],
    expectFormulas: ["sentrie@1_0_0_alpha.rb"],
  },
  {
    name: "Version with only separators in prerelease",
    version: "v1.0.0---",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0.rb"],
    expectFormulas: ["sentrie@1_0_0.rb"],
  },
  {
    name: "Version with all zeros",
    version: "v0.0.0",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@0_0_0.rb",
      "sentrie@0_0.rb",
      "sentrie@0.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@0_0_0.rb",
      "sentrie@0_0.rb",
      "sentrie@0.rb",
    ],
  },
  {
    name: "Prerelease with single character",
    version: "v1.0.0-a",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_a.rb"],
    expectFormulas: ["sentrie@1_0_0_a.rb"],
  },
  {
    name: "Prerelease with single number",
    version: "v1.0.0-1",
    prerelease: "true",
    expectCasks: ["sentrie@1_0_0_1.rb"],
    expectFormulas: ["sentrie@1_0_0_1.rb"],
  },
];

// Error test cases
const errorCases = [
  {
    name: "Missing PRERELEASE env var",
    env: { VERSION: "v1.2.3" },
    expectError: true,
  },
  {
    name: "Missing VERSION env var",
    env: { PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Invalid version format",
    env: { VERSION: "invalid", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Stable release with non-X.Y.Z format",
    env: { VERSION: "v1.2.3-alpha", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Empty version string",
    env: { VERSION: "", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with only dots",
    env: { VERSION: "...", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Non-numeric version",
    env: { VERSION: "vabc.def.ghi", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with only major",
    env: { VERSION: "v1", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with only major.minor",
    env: { VERSION: "v1.2", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with too many parts",
    env: { VERSION: "v1.2.3.4", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with non-numeric parts",
    env: { VERSION: "v1.2.x", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with negative numbers",
    env: { VERSION: "v-1.2.3", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Version with whitespace",
    env: { VERSION: "v1.2.3 ", PRERELEASE: "false" },
    expectError: true,
  },
  {
    name: "Invalid PRERELEASE value",
    env: { VERSION: "v1.2.3", PRERELEASE: "maybe" },
    expectError: false, // Should not error, just treat as false
  },
  {
    name: "PRERELEASE as empty string",
    env: { VERSION: "v1.2.3", PRERELEASE: "" },
    expectError: true, // Empty string is falsy, but script checks for existence
  },
  {
    name: "PRERELEASE as number string",
    env: { VERSION: "v1.2.3", PRERELEASE: "0" },
    expectError: false, // "0" !== "true", so treated as false
  },
  {
    name: "PRERELEASE as number string true",
    env: { VERSION: "v1.2.3", PRERELEASE: "1" },
    expectError: false, // "1" !== "true", so treated as false
  },
];

// Test case for missing formula template (should not fail)
// Test case specifically for comment removal
const commentRemovalTestCases = [
  {
    name: "Comment removal - various comment patterns",
    version: "v2.0.0",
    prerelease: "false",
    expectCasks: [
      "sentrie.rb",
      "sentrie@2_0_0.rb",
      "sentrie@2_0.rb",
      "sentrie@2.rb",
    ],
    expectFormulas: [
      "sentrie.rb",
      "sentrie@2_0_0.rb",
      "sentrie@2_0.rb",
      "sentrie@2.rb",
    ],
    modifyCaskTemplate: (template) => {
      // Add various comment patterns
      return `# This file was generated by GoReleaser. DO NOT EDIT.
# typed: false
# frozen_string_literal: true
# Additional comment
  # Indented comment
${template.split("\n").slice(1).join("\n")}`;
    },
    modifyFormulaTemplate: (template) => {
      // Add various comment patterns
      return `# This file was generated by GoReleaser. DO NOT EDIT.
# typed: false
# frozen_string_literal: true
# Additional comment
  # Indented comment
${template.split("\n").slice(2).join("\n")}`;
    },
  },
  {
    name: "Comment removal - prerelease with comments",
    version: "v1.5.0-beta.1",
    prerelease: "true",
    expectCasks: ["sentrie@1_5_0_beta_1.rb"],
    expectFormulas: ["sentrie@1_5_0_beta_1.rb"],
    modifyCaskTemplate: (template) => {
      return `# This file was generated by GoReleaser. DO NOT EDIT.
# typed: false
# frozen_string_literal: true
${template.split("\n").slice(1).join("\n")}`;
    },
    modifyFormulaTemplate: (template) => {
      return `# This file was generated by GoReleaser. DO NOT EDIT.
# typed: false
# frozen_string_literal: true
${template.split("\n").slice(2).join("\n")}`;
    },
  },
];

const optionalTestCases = [
  {
    name: "Missing formula template (optional)",
    version: "v1.0.0",
    prerelease: "false",
    createFormulaTemplate: false,
    expectCasks: [
      "sentrie.rb",
      "sentrie@1_0_0.rb",
      "sentrie@1_0.rb",
      "sentrie@1.rb",
    ],
    expectFormulas: [],
  },
  {
    name: "Missing formula template on prerelease",
    version: "v1.0.0-alpha",
    prerelease: "true",
    createFormulaTemplate: false,
    expectCasks: ["sentrie@1_0_0_alpha.rb"],
    expectFormulas: [],
  },
];

// Test cases for template content validation (should fail)
const templateContentTestCases = [
  {
    name: "Cask template with unexpected binary name",
    version: "v1.0.0",
    prerelease: "false",
    modifyCaskTemplate: (template) =>
      template.replace('binary "sentrie"', 'binary "other"'),
    expectError: true,
  },
  {
    name: "Cask template with unexpected cask name",
    version: "v1.0.0",
    prerelease: "false",
    modifyCaskTemplate: (template) =>
      template.replace('cask "sentrie"', 'cask "other"'),
    expectError: true,
  },
  {
    name: "Formula template with unexpected class name",
    version: "v1.0.0",
    prerelease: "false",
    modifyFormulaTemplate: (template) =>
      template.replace("class Sentrie", "class Other"),
    expectError: true,
  },
  {
    name: "Formula template without class declaration",
    version: "v1.0.0",
    prerelease: "false",
    modifyFormulaTemplate: (template) =>
      template.replace(/^class\s+Sentrie\s+<\s+Formula/m, ""),
    expectError: true,
  },
  {
    name: "Cask template missing binary declaration",
    version: "v1.0.0",
    prerelease: "false",
    modifyCaskTemplate: (template) =>
      template.replace('  binary "sentrie"', ""),
    expectError: true,
  },
  {
    name: "Cask template with binary but wrong indentation",
    version: "v1.0.0",
    prerelease: "false",
    modifyCaskTemplate: (template) =>
      template.replace('  binary "sentrie"', 'binary "sentrie"'),
    expectError: true,
  },
  {
    name: "Formula template with class name in comment",
    version: "v1.0.0",
    prerelease: "false",
    modifyFormulaTemplate: (template) =>
      template.replace(
        /^class\s+Sentrie\s+<\s+Formula/m,
        "# class Sentrie < Formula\nclass Other < Formula"
      ),
    expectError: true,
  },
  {
    name: "Cask template with cask name completely missing",
    version: "v1.0.0",
    prerelease: "false",
    modifyCaskTemplate: (template) =>
      template.replace('cask "sentrie" do', 'cask "other" do'),
    expectError: true,
  },
  {
    name: "Cask template with binary in comment",
    version: "v1.0.0",
    prerelease: "false",
    modifyCaskTemplate: (template) =>
      template.replace('  binary "sentrie"', '  # binary "sentrie"'),
    expectError: true,
  },
];

function setupTestDir() {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir, { recursive: true });
  mkdirSync(join(testDir, "Casks"), { recursive: true });
  mkdirSync(join(testDir, "Formula"), { recursive: true });
}

function createTemplateFiles(createFormula = true, modifiers = {}) {
  // Create cask template
  let caskTemplate = `# This file was generated by GoReleaser. DO NOT EDIT.
# typed: false
# frozen_string_literal: true
cask "sentrie" do
  name "sentrie"
  desc "Sentrie policy engine"
  homepage "https://sentrie.sh"
  version "1.2.3"

  binary "sentrie"

  on_macos do
    on_intel do
      url "https://github.com/sentrie-sh/sentrie/releases/download/v#{version}/sentrie_#{version}_darwin_amd64.tar.gz",
        verified: "github.com/sentrie-sh/sentrie"
      sha256 "test123"
    end
  end
end
`;

  // Create formula template
  let formulaTemplate = `# This file was generated by GoReleaser. DO NOT EDIT.
# typed: false
# frozen_string_literal: true
class Sentrie < Formula
  desc "Sentrie policy engine"
  homepage "https://sentrie.sh"
  version "1.2.3"
  license "Apache-2.0"

  on_macos do
    on_intel do
      url "https://github.com/sentrie-sh/sentrie/releases/download/v#{version}/sentrie_#{version}_darwin_amd64.tar.gz"
      sha256 "test123"
    end
  end

  def install
    bin.install "sentrie"
  end

  test do
    system "#{bin}/sentrie", "version"
  end
end
`;

  // Apply modifiers if provided
  if (modifiers.modifyCaskTemplate) {
    caskTemplate = modifiers.modifyCaskTemplate(caskTemplate);
  }
  if (modifiers.modifyFormulaTemplate) {
    formulaTemplate = modifiers.modifyFormulaTemplate(formulaTemplate);
  }

  writeFileSync(join(testDir, "Casks", "sentrie.rb.tmpl"), caskTemplate);
  if (createFormula) {
    writeFileSync(join(testDir, "Formula", "sentrie.rb.tmpl"), formulaTemplate);
  }
}

function runTest(testCase) {
  setupTestDir();
  const modifiers = {
    modifyCaskTemplate: testCase.modifyCaskTemplate,
    modifyFormulaTemplate: testCase.modifyFormulaTemplate,
  };
  createTemplateFiles(testCase.createFormulaTemplate !== false, modifiers);

  const env = {
    ...process.env,
    VERSION: testCase.version,
    PRERELEASE: testCase.prerelease,
  };

  try {
    execSync(`node ${scriptPath}`, {
      cwd: testDir,
      env,
      stdio: "pipe",
    });

    // Check expected files exist
    const caskDir = join(testDir, "Casks");
    const formulaDir = join(testDir, "Formula");

    // Verify templates are removed (critical - templates should never be committed)
    if (existsSync(join(caskDir, "sentrie.rb.tmpl"))) {
      throw new Error("Cask template should be removed");
    }
    if (testCase.createFormulaTemplate !== false) {
      if (existsSync(join(formulaDir, "sentrie.rb.tmpl"))) {
        throw new Error("Formula template should be removed");
      }
    }

    // Check expected cask files
    for (const file of testCase.expectCasks) {
      const path = join(caskDir, file);
      if (!existsSync(path)) {
        throw new Error(`Expected cask file not found: ${file}`);
      }
      // Verify content for versioned casks
      if (file.startsWith("sentrie@")) {
        const content = readFileSync(path, "utf8");
        if (!content.includes(`cask "sentrie@`)) {
          throw new Error(`Versioned cask ${file} has incorrect cask name`);
        }
        // Extract version from filename and verify binary target
        const filenameVersion = file
          .replace(/^sentrie@/, "")
          .replace(/\.rb$/, "");
        // The binary target should use the original version format, not the tokenSuffix
        // For version "1.2.3", binary target should be "sentrie@1.2.3"
        // But we need to reconstruct the original version from the test case
        // This is a simplified check - verify binary target exists
        if (!content.includes('binary "sentrie", target: "sentrie@')) {
          throw new Error(`Versioned cask ${file} missing binary target`);
        }
      } else if (file === "sentrie.rb") {
        // Default cask should have original cask name and binary
        const content = readFileSync(path, "utf8");
        if (!content.includes('cask "sentrie" do')) {
          throw new Error(`Default cask ${file} has incorrect cask name`);
        }
        if (!content.includes('binary "sentrie"')) {
          throw new Error(`Default cask ${file} missing binary declaration`);
        }
      }
    }

    // Check expected formula files
    for (const file of testCase.expectFormulas) {
      const path = join(formulaDir, file);
      if (!existsSync(path)) {
        throw new Error(`Expected formula file not found: ${file}`);
      }
      // Verify content for formulas
      const content = readFileSync(path, "utf8");

      if (file === "sentrie.rb") {
        // Default formula should have class Sentrie
        if (!content.includes("class Sentrie < Formula")) {
          throw new Error(`Default formula ${file} should have class Sentrie`);
        }
      } else {
        // Versioned formulas should have class SentrieAT{tokenSuffix}
        // Extract tokenSuffix from filename: sentrie@1_2_3.rb -> 1_2_3
        const tokenSuffix = file.replace(/^sentrie@/, "").replace(/\.rb$/, "");
        const expectedClassName = `SentrieAT${tokenSuffix}`;
        if (!content.includes(`class ${expectedClassName} < Formula`)) {
          throw new Error(
            `Versioned formula ${file} should have class ${expectedClassName}, but content shows: ${
              content.match(/class\s+\w+\s+<\s+Formula/)?.[0] || "not found"
            }`
          );
        }
      }
    }

    // Verify no unexpected files
    const allCasks = require("fs")
      .readdirSync(caskDir)
      .filter((f) => f.endsWith(".rb"));
    const allFormulas = require("fs")
      .readdirSync(formulaDir)
      .filter((f) => f.endsWith(".rb"));

    const unexpectedCasks = allCasks.filter(
      (f) => !testCase.expectCasks.includes(f)
    );
    const unexpectedFormulas = allFormulas.filter(
      (f) => !testCase.expectFormulas.includes(f)
    );

    if (unexpectedCasks.length > 0) {
      throw new Error(`Unexpected cask files: ${unexpectedCasks.join(", ")}`);
    }
    if (unexpectedFormulas.length > 0) {
      throw new Error(
        `Unexpected formula files: ${unexpectedFormulas.join(", ")}`
      );
    }

    // Verify file contents are not empty and have valid structure
    for (const file of [...testCase.expectCasks, ...testCase.expectFormulas]) {
      const actualDir = testCase.expectCasks.includes(file)
        ? "Casks"
        : "Formula";
      const path = join(testDir, actualDir, file);
      if (existsSync(path)) {
        const content = readFileSync(path, "utf8");
        if (content.length === 0) {
          throw new Error(`File ${file} is empty`);
        }
        
        // Verify comment lines are removed
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed.length > 0 && trimmed.startsWith("#")) {
            throw new Error(
              `File ${file} contains comment line at line ${i + 1}: ${trimmed}`
            );
          }
        }
        
        // Verify files are valid Ruby syntax (basic check)
        if (actualDir === "Casks") {
          if (!content.includes("cask")) {
            throw new Error(`Cask file ${file} missing cask declaration`);
          }
          if (!content.includes("do") && !content.includes("end")) {
            throw new Error(`Cask file ${file} appears to be invalid`);
          }
        } else {
          if (!content.includes("class")) {
            throw new Error(`Formula file ${file} missing class declaration`);
          }
          if (!content.includes("Formula")) {
            throw new Error(`Formula file ${file} missing Formula inheritance`);
          }
        }
      }
    }

    console.log(`✓ ${testCase.name}`);
    return true;
  } catch (error) {
    console.error(`✗ ${testCase.name}: ${error.message}`);
    return false;
  }
}

function runErrorTest(errorCase) {
  setupTestDir();

  // Handle template modification for error cases
  const modifiers = {
    modifyCaskTemplate: errorCase.modifyCaskTemplate,
    modifyFormulaTemplate: errorCase.modifyFormulaTemplate,
  };
  createTemplateFiles(true, modifiers);

  const env = {
    ...process.env,
    ...errorCase.env,
    VERSION: errorCase.version || errorCase.env?.VERSION,
    PRERELEASE: errorCase.prerelease || errorCase.env?.PRERELEASE,
  };

  try {
    execSync(`node ${scriptPath}`, {
      cwd: testDir,
      env,
      stdio: "pipe",
    });
    if (errorCase.expectError) {
      console.error(`✗ ${errorCase.name}: Expected error but script succeeded`);
      return false;
    } else {
      console.log(`✓ ${errorCase.name} (correctly succeeded)`);
      return true;
    }
  } catch (error) {
    if (errorCase.expectError) {
      console.log(`✓ ${errorCase.name} (correctly failed)`);
      return true;
    } else {
      console.error(`✗ ${errorCase.name}: Unexpected error: ${error.message}`);
      return false;
    }
  }
}

// Run tests
console.log("Running stress tests for create-sentrie-casks.js\n");

let passed = 0;
let failed = 0;

console.log("=== Normal Test Cases ===");
for (const testCase of testCases) {
  if (runTest(testCase)) {
    passed++;
  } else {
    failed++;
  }
}

console.log("\n=== Error Test Cases ===");
for (const errorCase of errorCases) {
  if (runErrorTest(errorCase)) {
    passed++;
  } else {
    failed++;
  }
}

console.log("\n=== Optional Test Cases ===");
for (const testCase of optionalTestCases) {
  if (runTest(testCase)) {
    passed++;
  } else {
    failed++;
  }
}

console.log("\n=== Template Content Test Cases ===");
for (const testCase of templateContentTestCases) {
  if (runErrorTest(testCase)) {
    passed++;
  } else {
    failed++;
  }
}

console.log("\n=== Comment Removal Test Cases ===");
for (const testCase of commentRemovalTestCases) {
  if (runTest(testCase)) {
    passed++;
  } else {
    failed++;
  }
}

// Cleanup
if (existsSync(testDir)) {
  rmSync(testDir, { recursive: true, force: true });
}

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);
