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
  assert.equal(afterFailure.lastRun.retainedCommit, beforeFailure.installedCommit);
  assert.deepEqual(await fs.readdir(path.join(homeDirectory, ".agents", "agent-skills", "transactions")), []);

  // Inject faults only in disposable homes; all cases run sequentially and restore fs.
  async function checkRecoveryFailure(name, method, shouldFail, options = {}) {
    const faultHome = path.join(temporaryRoot, name);
    await fs.cp(homeDirectory, faultHome, { recursive: true });
    const managerRoot = path.join(faultHome, ".agents", "agent-skills");
    const context = {
      skillPath: path.join(faultHome, ".agents", "skills", "afk"),
      statePath: path.join(managerRoot, "state.json"),
      lockPath: path.join(faultHome, ".agents", ".skill-lock.json"),
      lastRunPath: path.join(managerRoot, "last-run.json"),
    };
    context.state = await fs.readFile(context.statePath, "utf8");
    context.lock = await fs.readFile(context.lockPath, "utf8");
    const original = fs[method];
    let injected = false;
    fs[method] = async (...args) => {
      if (shouldFail(context, ...args)) {
        injected = true;
        throw Object.assign(new Error(`Injected ${name}`), { code: "EACCES" });
      }
      return original(...args);
    };
    let failure;
    try {
      await assert.rejects(applyCandidate(candidateThree, { homeDirectory: faultHome, ...options }), (error) => {
        failure = error;
        return true;
      });
    } finally {
      fs[method] = original;
    }
    assert.equal(injected, true, `${name}: fault was exercised`);
    const status = await catalogStatus({ homeDirectory: faultHome, checkRemote: false });
    assert.equal(status.lastRun.status, "rollback-failed", name);
    assert.equal(status.lastRun.retainedCommit, null, name);
    assert.equal(status.lastRun.previousCommit, beforeFailure.installedCommit, name);
    assert.ok(status.lastRun.rollbackErrors.some((error) => error.includes(`Injected ${name}`)), name);
    assert.ok(failure.message.includes(`Injected ${name}`), name);
    assert.ok(failure.message.includes(status.lastRun.error), name);
    assert.ok(failure.message.includes(status.lastRun.recoveryPath), name);
    assert.deepEqual(await fs.readdir(path.join(managerRoot, "transactions")), [path.basename(status.lastRun.recoveryPath)]);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(status.lastRun.recoveryPath, "previous-metadata.json"), "utf8")), {
      state: context.state, lock: context.lock,
    });
    if (method !== "writeFile") {
      assert.equal(await hashDirectory(path.join(status.lastRun.recoveryPath, "backup", "afk")), beforeFailureHash);
      assert.equal(status.discoverable, false, name);
    }
  }

  await checkRecoveryFailure("directory-restore-failure", "rename",
    (_context, from) => from.endsWith(path.join("backup", "afk")),
    { simulateFailureAfterInstalls: 1 });
  await checkRecoveryFailure("new-install-removal-failure", "rm",
    (context, target) => target === context.skillPath,
    { simulateFailureAfterInstalls: 1 });
  for (const key of ["state", "lock"]) {
    await checkRecoveryFailure(`${key}-restore-failure`, "writeFile", (context, target, content) =>
      // Fail the update's final report, then fail restoration of one metadata file.
      (target.startsWith(`${context.lastRunPath}.new-`) && JSON.parse(content).success === true)
      || (target.startsWith(`${context[`${key}Path`]}.new-`) && content === context[key]));
  }

  const cleanupHome = path.join(temporaryRoot, "cleanup-failure");
  await fs.cp(homeDirectory, cleanupHome, { recursive: true });
  const originalRm = fs.rm;
  let cleanupInjected = false;
  fs.rm = async (target, ...args) => {
    if (target.startsWith(path.join(cleanupHome, ".agents", "agent-skills", "transactions") + path.sep)) {
      cleanupInjected = true;
      // A recursive cleanup may have already deleted part of the backup.
      await originalRm(path.join(target, "backup", "afk"), { recursive: true, force: true });
      throw new Error("Injected transaction cleanup failure");
    }
    return originalRm(target, ...args);
  };
  let cleanupResult;
  try {
    cleanupResult = await applyCandidate(candidateThree, { homeDirectory: cleanupHome });
  } finally {
    fs.rm = originalRm;
  }
  assert.equal(cleanupInjected, true);
  assert.equal(cleanupResult.status, "updated");
  assert.match(cleanupResult.warning, /Injected transaction cleanup failure/);
  const afterCleanupFailure = await catalogStatus({ homeDirectory: cleanupHome, checkRemote: false });
  assert.equal(afterCleanupFailure.installedCommit, candidateThree.commit);
  assert.equal(afterCleanupFailure.discoverable, true);
  assert.equal(afterCleanupFailure.lastRun.success, true);
  assert.equal(afterCleanupFailure.lastRun.warning, cleanupResult.warning);

  const invalidRoot = path.join(temporaryRoot, "invalid-candidate");
  await copyRepository(invalidRoot);
  await fs.writeFile(path.join(invalidRoot, "skills", "afk", "SKILL.md"), "# Missing frontmatter\n");
  await assert.rejects(loadCandidate(invalidRoot, "test-invalid"), /missing YAML frontmatter/);
  assert.equal(await hashDirectory(managedSkillRoot), beforeFailureHash);

  console.log("MANAGER_TEST_OK registration, add/modify/remove, validation rejection, rollback, recovery faults, and cleanup faults passed.");
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
