import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ps1",
  ".sh",
  ".toml",
  ".ts",
  ".txt",
  ".yaml",
  ".yml",
]);

const BLOCKED_TERMS = [
  ["A", "collection"].join("_"),
  ["A", "watch", "maid"].join("_"),
  ["Tuan", "Chat"].join(""),
  ["tuan", "chat"].join("-"),
  ["Web", "GAL"].join(""),
  ["mei", "tuan"].join(""),
  "美" + "团",
];

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root, current = root, files = []) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(root, fullPath, files);
    } else if (entry.isFile()) {
      files.push({
        fullPath,
        relativePath: toPosix(path.relative(root, fullPath)),
      });
    }
  }
  return files;
}

export async function hashDirectory(directory) {
  const files = await walkFiles(directory);
  files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update(await fs.readFile(file.fullPath));
  }
  return hash.digest("hex");
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function readFrontmatter(text, filePath) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${filePath}: missing YAML frontmatter`);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const colon = line.indexOf(":");
    if (colon < 1 || /^\s/.test(line)) continue;
    fields[line.slice(0, colon).trim()] = parseScalar(line.slice(colon + 1));
  }
  return fields;
}

function assertInside(root, candidate, label) {
  const relative = path.relative(root, candidate);
  if (!relative || relative === ".") return;
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes its allowed root`);
  }
}

async function validateMarkdownLinks(filePath, root) {
  const text = (await fs.readFile(filePath, "utf8"))
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "");
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of text.matchAll(linkPattern)) {
    let target = match[1].trim();
    if (!target || /^(?:https?:|mailto:|data:|#)/i.test(target)) continue;
    if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
    target = target.split("#", 1)[0].trim();
    if (!target || target.includes("${") || target.includes("<")) continue;
    const resolved = path.resolve(path.dirname(filePath), decodeURIComponent(target));
    assertInside(root, resolved, `${filePath}: relative link ${target}`);
    if (!(await exists(resolved))) throw new Error(`${filePath}: missing relative link target ${target}`);
  }
}

function checkCommand(command, args, label, { optional = false, input } = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false, input });
  if (result.error?.code === "ENOENT" && optional) return `${label}: ${command} unavailable; syntax check deferred to CI`;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "syntax check failed").trim();
    throw new Error(`${label}: ${detail}`);
  }
  return null;
}

async function validateScriptSyntax(root, files) {
  const warnings = [];
  for (const file of files) {
    const extension = path.extname(file.fullPath).toLowerCase();
    if ([".js", ".mjs", ".cjs"].includes(extension)) {
      checkCommand(process.execPath, ["--check", file.fullPath], file.relativePath);
    } else if (extension === ".sh") {
      const useStandardInput = process.platform === "win32";
      const warning = checkCommand("bash", useStandardInput ? ["-n"] : ["-n", file.fullPath], file.relativePath, {
        optional: true,
        input: useStandardInput ? await fs.readFile(file.fullPath) : undefined,
      });
      if (warning) warnings.push(warning);
    } else if (extension === ".ps1") {
      const shell = process.platform === "win32" ? "powershell" : "pwsh";
      const script = [
        "$errors = $null",
        `[void][System.Management.Automation.Language.Parser]::ParseFile('${file.fullPath.replaceAll("'", "''")}', [ref]$null, [ref]$errors)`,
        "if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Error $_ }; exit 1 }",
      ].join("; ");
      const warning = checkCommand(shell, ["-NoProfile", "-NonInteractive", "-Command", script], file.relativePath, { optional: process.platform !== "win32" });
      if (warning) warnings.push(warning);
    }
  }
  return warnings;
}

async function validatePublicBoundary(root, files) {
  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file.fullPath).toLowerCase())) continue;
    const text = await fs.readFile(file.fullPath, "utf8");
    const lowered = text.toLowerCase();
    for (const term of BLOCKED_TERMS) {
      if (lowered.includes(term.toLowerCase())) {
        throw new Error(`${file.relativePath}: contains excluded project or company term`);
      }
    }
    if (/\b[A-Za-z]:\\(?:Users|Documents|Projects|Downloads|Desktop)\\/i.test(text)) {
      throw new Error(`${file.relativePath}: contains a machine-specific absolute path`);
    }
    if (/https?:\/\/(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)/i.test(text)) {
      throw new Error(`${file.relativePath}: contains a private network address`);
    }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) throw new Error(`${file.relativePath}: contains secret-like material`);
    }
  }
}

async function validateEmbeddedLicense(root, skill, origin) {
  const canonicalLicense = path.resolve(root, origin.licenseFile);
  assertInside(root, canonicalLicense, `${skill.name}: license`);
  if (!(await exists(canonicalLicense))) throw new Error(`${skill.name}: missing origin license ${origin.licenseFile}`);
  const embeddedLicense = path.join(root, skill.path, "LICENSE.txt");
  if (!(await exists(embeddedLicense))) throw new Error(`${skill.name}: missing embedded LICENSE.txt`);
  const [canonical, embedded] = await Promise.all([
    fs.readFile(canonicalLicense),
    fs.readFile(embeddedLicense),
  ]);
  if (!canonical.equals(embedded)) throw new Error(`${skill.name}: embedded license differs from ${origin.licenseFile}`);
  if (skill.origin === "mattpocock" && !(await exists(path.join(root, skill.path, "SOURCE.md")))) {
    throw new Error(`${skill.name}: missing standalone upstream source notice`);
  }
}

export async function validateCatalog(root, { checkScripts = true } = {}) {
  const resolvedRoot = path.resolve(root);
  const manifestPath = path.join(resolvedRoot, "skills-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1) throw new Error("skills-manifest.json: unsupported schemaVersion");
  if (manifest.repository !== "starrybamboo/agent-skills") throw new Error("skills-manifest.json: unexpected repository");
  if (manifest.defaultBranch !== "main") throw new Error("skills-manifest.json: main must be the catalog entrypoint");
  if (!manifest.origins || !Array.isArray(manifest.skills) || manifest.skills.length === 0) {
    throw new Error("skills-manifest.json: origins and skills are required");
  }

  const skillRoot = path.join(resolvedRoot, "skills");
  const directoryNames = (await fs.readdir(skillRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const names = new Set();
  const validatedSkills = [];

  for (const skill of manifest.skills) {
    if (!NAME_PATTERN.test(skill.name) || skill.name.length > 64) throw new Error(`${skill.name}: invalid skill name`);
    if (names.has(skill.name)) throw new Error(`${skill.name}: duplicate manifest name`);
    names.add(skill.name);
    if (skill.path !== `skills/${skill.name}`) throw new Error(`${skill.name}: path must equal skills/${skill.name}`);
    const origin = manifest.origins[skill.origin];
    if (!origin?.repository || origin.license !== "MIT" || !origin.licenseFile) {
      throw new Error(`${skill.name}: incomplete public origin metadata`);
    }
    const directory = path.resolve(resolvedRoot, skill.path);
    assertInside(skillRoot, directory, `${skill.name}: path`);
    const entrypoint = path.join(directory, "SKILL.md");
    const text = await fs.readFile(entrypoint, "utf8");
    const frontmatter = readFrontmatter(text, entrypoint);
    if (frontmatter.name !== skill.name) throw new Error(`${skill.name}: frontmatter name does not match folder`);
    if (typeof frontmatter.description !== "string" || !frontmatter.description.trim()) {
      throw new Error(`${skill.name}: frontmatter description is required`);
    }
    const openAiMetadata = path.join(directory, "agents", "openai.yaml");
    if (frontmatter["disable-model-invocation"] === true && await exists(openAiMetadata)) {
      const yaml = await fs.readFile(openAiMetadata, "utf8");
      if (!/allow_implicit_invocation:\s*false\b/.test(yaml)) {
        throw new Error(`${skill.name}: explicit-only frontmatter conflicts with agents/openai.yaml`);
      }
    }
    await validateEmbeddedLicense(resolvedRoot, skill, origin);
    validatedSkills.push({
      ...skill,
      directory,
      folderHash: await hashDirectory(directory),
    });
  }

  const manifestNames = [...names].sort();
  if (JSON.stringify(directoryNames) !== JSON.stringify(manifestNames)) {
    throw new Error(`skills-manifest.json does not match skills/: manifest=${manifestNames.join(",")} directories=${directoryNames.join(",")}`);
  }

  const files = await walkFiles(resolvedRoot);
  for (const file of files.filter((item) => path.extname(item.fullPath).toLowerCase() === ".md")) {
    await validateMarkdownLinks(file.fullPath, resolvedRoot);
  }
  await validatePublicBoundary(resolvedRoot, files);
  const warnings = checkScripts ? await validateScriptSyntax(resolvedRoot, files) : [];

  return { root: resolvedRoot, manifest, skills: validatedSkills, warnings };
}
