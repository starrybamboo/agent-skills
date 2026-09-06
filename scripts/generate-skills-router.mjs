import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFrontmatter } from "../skills/shared-skills-manager/scripts/catalog.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repositoryRoot, "skills-manifest.json");
const routerPath = path.join(repositoryRoot, "skills-router.json");
const checkOnly = process.argv.includes("--check");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
if (
  manifest.schemaVersion !== 1
  || typeof manifest.repository !== "string"
  || typeof manifest.defaultBranch !== "string"
  || !Array.isArray(manifest.skills)
) {
  throw new Error("skills-manifest.json: invalid catalog metadata");
}

const skills = [];

for (const skill of manifest.skills) {
  const entrypoint = `${skill.path}/SKILL.md`;
  const entrypointPath = path.join(repositoryRoot, ...entrypoint.split("/"));
  const text = await fs.readFile(entrypointPath, "utf8");
  const frontmatter = readFrontmatter(text, entrypointPath);

  if (frontmatter.name !== skill.name) {
    throw new Error(`${entrypoint}: frontmatter name does not match manifest`);
  }
  if (typeof frontmatter.description !== "string" || !frontmatter.description.trim()) {
    throw new Error(`${entrypoint}: frontmatter description is required`);
  }

  skills.push({
    name: skill.name,
    entrypoint,
    description: frontmatter.description.trim(),
    disableModelInvocation: frontmatter["disable-model-invocation"] === true,
  });
}

const expected = `${JSON.stringify({
  schemaVersion: 1,
  repository: manifest.repository,
  defaultBranch: manifest.defaultBranch,
  skills,
}, null, 2)}\n`;

if (checkOnly) {
  let actual;
  try {
    actual = await fs.readFile(routerPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error("skills-router.json is missing; run npm run generate:router");
    }
    throw error;
  }

  if (actual !== expected) {
    throw new Error("skills-router.json is stale; run npm run generate:router");
  }

  console.log(`VALID ${skills.length} routable skills; skills-router.json is current.`);
} else {
  await fs.writeFile(routerPath, expected, "utf8");
  console.log(`WROTE skills-router.json with ${skills.length} skills.`);
}
