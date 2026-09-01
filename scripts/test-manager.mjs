import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashDirectory } from "../skills/shared-skills-manager/scripts/catalog.mjs";
import {
  HUB_REPOSITORY,
  HUB_URL,
  applyCandidate,
  catalogStatus,
  loadCandidate,
  registerInstalledCatalog,
} from "../skills/shared-skills-manager/scripts/manage-shared-skills.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = await fs.mkdtemp(path.join(tmpdir(), "shared-skills-manager-test-"));
const homeDirectory = path.join(temporaryRoot, "home");

async function copyRepository(destination) {
  await fs.cp(repositoryRoot, destination, {
    recursive: true,
    filter(source) {
      const name = path.basename(source);
      return name !== ".git" && name !== "node_modules";
    },
  });
}

async function seedNpxInstall(candidate) {
  const skillsRoot = path.join(homeDirectory, ".agents", "skills");
  await fs.mkdir(skillsRoot, { recursive: true });
  const lock = { version: 3, skills: {}, dismissed: {} };
  const now = new Date().toISOString();
  for (const skill of candidate.skills) {
    await fs.cp(skill.directory, path.join(skillsRoot, skill.name), { recursive: true });
    lock.skills[skill.name] = {
      source: HUB_REPOSITORY,
      sourceType: "github",
      sourceUrl: HUB_URL,
      skillPath: `skills/${skill.name}/SKILL.md`,
      skillFolderHash: skill.treeHash || skill.folderHash,
      installedAt: now,
      updatedAt: now,
    };
  }
  await fs.writeFile(path.join(homeDirectory, ".agents", ".skill-lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
}

async function mutateCandidate(destination) {
  await copyRepository(destination);
  const manifestPath = path.join(destination, "skills-manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.skills = manifest.skills.filter((skill) => skill.name !== "wait-what");
  manifest.skills.push({ name: "test-new-skill", path: "skills/test-new-skill", origin: "original" });
  manifest.skills.sort((left, right) => left.name.localeCompare(right.name));
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.rm(path.join(destination, "skills", "wait-what"), { recursive: true, force: true });
  await fs.appendFile(path.join(destination, "skills", "afk", "SKILL.md"), "\n<!-- transactional update fixture -->\n");
  const newSkillRoot = path.join(destination, "skills", "test-new-skill");
  await fs.mkdir(newSkillRoot, { recursive: true });
  await fs.writeFile(path.join(newSkillRoot, "SKILL.md"), [
    "---",
    "name: test-new-skill",
    "description: Exercise catalog additions in the transaction test.",
    "---",
    "",
    "# Test new skill",
    "",
    "This directory exists only inside a temporary test candidate.",
    "",
  ].join("\n"));
  await fs.copyFile(path.join(destination, "LICENSE"), path.join(newSkillRoot, "LICENSE.txt"));
}

try {
  const initial = await loadCandidate(repositoryRoot, "test-v1");
  await seedNpxInstall(initial);
  const registered = await registerInstalledCatalog(initial, { homeDirectory });
  assert.equal(registered.status, "registered");

  const candidateTwoRoot = path.join(temporaryRoot, "candidate-two");
  await mutateCandidate(candidateTwoRoot);
  const candidateTwo = await loadCandidate(candidateTwoRoot, "test-v2");
  const updated = await applyCandidate(candidateTwo, { homeDirectory });
  assert.deepEqual(updated.added, ["test-new-skill"]);
  assert.deepEqual(updated.modified, ["afk"]);
  assert.deepEqual(updated.removed, ["wait-what"]);
  assert.equal(await fs.access(path.join(homeDirectory, ".agents", "skills", "test-new-skill", "SKILL.md")).then(() => true), true);
  assert.equal(await fs.access(path.join(homeDirectory, ".agents", "skills", "wait-what")).then(() => true).catch(() => false), false);

  const beforeFailure = await catalogStatus({ homeDirectory, checkRemote: false });
  const managedSkillRoot = path.join(homeDirectory, ".agents", "skills", "afk");
  const beforeFailureHash = await hashDirectory(managedSkillRoot);
  const candidateThreeRoot = path.join(temporaryRoot, "candidate-three");
  await copyRepository(candidateThreeRoot);
  await fs.appendFile(path.join(candidateThreeRoot, "skills", "afk", "SKILL.md"), "\n<!-- rollback fixture -->\n");
  const candidateThree = await loadCandidate(candidateThreeRoot, "test-v3");
  await assert.rejects(
    applyCandidate(candidateThree, { homeDirectory, simulateFailureAfterInstalls: 1 }),
    /Simulated transactional installation failure/,
  );
  assert.equal(await hashDirectory(managedSkillRoot), beforeFailureHash);
  const afterFailure = await catalogStatus({ homeDirectory, checkRemote: false });
  assert.equal(afterFailure.installedCommit, beforeFailure.installedCommit);
  assert.equal(afterFailure.discoverable, true);

  const invalidRoot = path.join(temporaryRoot, "invalid-candidate");
  await copyRepository(invalidRoot);
  await fs.writeFile(path.join(invalidRoot, "skills", "afk", "SKILL.md"), "# Missing frontmatter\n");
  await assert.rejects(loadCandidate(invalidRoot, "test-invalid"), /missing YAML frontmatter/);
  assert.equal(await hashDirectory(managedSkillRoot), beforeFailureHash);

  console.log("MANAGER_TEST_OK registration, add/modify/remove, validation rejection, and rollback passed.");
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
