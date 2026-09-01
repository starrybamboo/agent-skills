import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalog, hashDirectory } from "./catalog.mjs";

export const HUB_REPOSITORY = "starrybamboo/agent-skills";
export const HUB_URL = "https://github.com/starrybamboo/agent-skills.git";
const STATE_VERSION = 1;

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function safeName(name, label = "name") {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`Unsafe ${label}: ${name}`);
  return name;
}

function safeCommit(value) {
  if (!/^[A-Za-z0-9._-]+$/.test(value)) throw new Error(`Unsafe source revision: ${value}`);
  return value;
}

function resolvePaths(homeDirectory = homedir()) {
  const home = path.resolve(homeDirectory);
  const agentsRoot = path.join(home, ".agents");
  const managerRoot = path.join(agentsRoot, "agent-skills");
  const useXdgLock = home === path.resolve(homedir()) && process.env.XDG_STATE_HOME;
  return {
    home,
    agentsRoot,
    skillsRoot: path.join(agentsRoot, "skills"),
    managerRoot,
    releasesRoot: path.join(managerRoot, "releases"),
    transactionsRoot: path.join(managerRoot, "transactions"),
    statePath: path.join(managerRoot, "state.json"),
    lastRunPath: path.join(managerRoot, "last-run.json"),
    lockPath: useXdgLock
      ? path.join(path.resolve(process.env.XDG_STATE_HOME), "skills", ".skill-lock.json")
      : path.join(agentsRoot, ".skill-lock.json"),
  };
}

function run(command, args, { cwd } = {}) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: false });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || `exit ${result.status}`).trim();
    throw new Error(`${command} ${args.join(" ")}: ${detail}`);
  }
  return result.stdout.trim();
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw new Error(`${filePath}: invalid JSON (${error.message})`);
  }
}

async function replaceFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const nonce = `${process.pid}-${randomUUID()}`;
  const temporary = `${filePath}.new-${nonce}`;
  const previous = `${filePath}.old-${nonce}`;
  await fs.writeFile(temporary, content, "utf8");
  const hadPrevious = await exists(filePath);
  if (hadPrevious) await fs.rename(filePath, previous);
  try {
    await fs.rename(temporary, filePath);
    if (hadPrevious) await fs.rm(previous, { force: true });
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => {});
    if (hadPrevious && await exists(previous) && !(await exists(filePath))) {
      await fs.rename(previous, filePath).catch(() => {});
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await replaceFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizedUrl(value) {
  return String(value || "").replace(/\/+$/, "").replace(/\.git$/i, "").toLowerCase();
}

function isHubOwnedLockEntry(entry) {
  if (!entry) return false;
  return entry.source === HUB_REPOSITORY || normalizedUrl(entry.sourceUrl) === normalizedUrl(HUB_URL);
}

function lockEntryFor(skill, existing, now) {
  const entry = {
    ...(existing || {}),
    source: HUB_REPOSITORY,
    sourceType: "github",
    sourceUrl: HUB_URL,
    skillPath: `skills/${skill.name}/SKILL.md`,
    skillFolderHash: skill.treeHash || skill.folderHash,
    installedAt: existing?.installedAt || now,
    updatedAt: now,
  };
  delete entry.ref;
  if (!entry.pluginName) delete entry.pluginName;
  return entry;
}

async function readLock(paths) {
  return await readJson(paths.lockPath, { version: 3, skills: {}, dismissed: {} });
}

async function gitTreeHash(root, name) {
  try {
    return run("git", ["rev-parse", `HEAD:skills/${safeName(name)}`], { cwd: root });
  } catch {
    return null;
  }
}

export async function loadCandidate(candidateRoot, commit = null) {
  const catalog = await validateCatalog(candidateRoot);
  let resolvedCommit = commit;
  if (!resolvedCommit) resolvedCommit = run("git", ["rev-parse", "HEAD"], { cwd: catalog.root });
  safeCommit(resolvedCommit);
  const skills = [];
  for (const skill of catalog.skills) {
    skills.push({
      name: skill.name,
      path: skill.path,
      directory: skill.directory,
      folderHash: skill.folderHash,
      treeHash: await gitTreeHash(catalog.root, skill.name),
    });
  }
  return { root: catalog.root, commit: resolvedCommit, skills, warnings: catalog.warnings };
}

async function cloneMain() {
  const temporaryRoot = await fs.mkdtemp(path.join(tmpdir(), "agent-skills-candidate-"));
  const repositoryRoot = path.join(temporaryRoot, "repository");
  try {
    run("git", ["clone", "--depth", "1", "--branch", "main", "--single-branch", HUB_URL, repositoryRoot]);
    const candidate = await loadCandidate(repositoryRoot);
    return { temporaryRoot, candidate };
  } catch (error) {
    await fs.rm(temporaryRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

function candidateState(candidate, releasePath) {
  const skills = {};
  for (const skill of candidate.skills) {
    skills[skill.name] = {
      folderHash: skill.folderHash,
      treeHash: skill.treeHash,
      skillPath: `skills/${skill.name}/SKILL.md`,
    };
  }
  return {
    version: STATE_VERSION,
    source: HUB_REPOSITORY,
    sourceUrl: HUB_URL,
    branch: "main",
    installedCommit: candidate.commit,
    currentRelease: releasePath,
    updatedAt: new Date().toISOString(),
    skills,
  };
}

async function materializeRelease(candidate, paths) {
  const revision = safeCommit(candidate.commit);
  const releasePath = path.join(paths.releasesRoot, revision);
  if (await exists(releasePath)) return releasePath;
  await fs.mkdir(paths.releasesRoot, { recursive: true });
  const staging = path.join(paths.releasesRoot, `.staging-${revision}-${randomUUID()}`);
  await fs.mkdir(path.join(staging, "skills"), { recursive: true });
  try {
    for (const skill of candidate.skills) {
      await fs.cp(skill.directory, path.join(staging, "skills", skill.name), { recursive: true, force: false });
    }
    await fs.copyFile(path.join(candidate.root, "skills-manifest.json"), path.join(staging, "skills-manifest.json"));
    await fs.rename(staging, releasePath);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
  return releasePath;
}

async function inspectManagedInstall(paths, state, lock) {
  const drift = [];
  for (const [name, record] of Object.entries(state.skills || {})) {
    safeName(name);
    const target = path.join(paths.skillsRoot, name);
    if (!(await exists(target))) {
      drift.push(`${name}: missing installation`);
      continue;
    }
    const actualHash = await hashDirectory(target);
    if (actualHash !== record.folderHash) drift.push(`${name}: installed content differs from managed state`);
    if (!isHubOwnedLockEntry(lock.skills?.[name])) drift.push(`${name}: source lock is not owned by ${HUB_REPOSITORY}`);
    if (!(await exists(path.join(target, "SKILL.md")))) drift.push(`${name}: Codex entrypoint is missing`);
  }
  return drift;
}

async function recordLastRun(paths, value) {
  await writeJson(paths.lastRunPath, { at: new Date().toISOString(), ...value });
}

export async function registerInstalledCatalog(candidate, { homeDirectory = homedir() } = {}) {
  const paths = resolvePaths(homeDirectory);
  const existingState = await readJson(paths.statePath, null);
  if (existingState) return applyCandidate(candidate, { homeDirectory });

  const lock = await readLock(paths);
  const problems = [];
  for (const skill of candidate.skills) {
    const target = path.join(paths.skillsRoot, skill.name);
    if (!(await exists(target))) {
      problems.push(`${skill.name}: missing global installation`);
      continue;
    }
    if (await hashDirectory(target) !== skill.folderHash) problems.push(`${skill.name}: installed files do not match validated Hub main`);
    if (!isHubOwnedLockEntry(lock.skills?.[skill.name])) problems.push(`${skill.name}: npx source metadata is not ${HUB_REPOSITORY}`);
  }
  if (problems.length) {
    throw new Error(`Setup cannot adopt the current installation:\n- ${problems.join("\n- ")}\nRun the documented npx install command, then retry setup.`);
  }

  const releasePath = await materializeRelease(candidate, paths);
  const state = candidateState(candidate, releasePath);
  await writeJson(paths.statePath, state);
  const result = { status: "registered", commit: candidate.commit, added: [], modified: [], removed: [] };
  await recordLastRun(paths, { success: true, ...result });
  return result;
}

function compareState(state, candidate) {
  const previousNames = new Set(Object.keys(state.skills || {}));
  const candidateByName = new Map(candidate.skills.map((skill) => [skill.name, skill]));
  const added = [];
  const modified = [];
  const removed = [];
  for (const skill of candidate.skills) {
    if (!previousNames.has(skill.name)) added.push(skill.name);
    else if (state.skills[skill.name].folderHash !== skill.folderHash) modified.push(skill.name);
  }
  for (const name of previousNames) if (!candidateByName.has(name)) removed.push(name);
  return { added: added.sort(), modified: modified.sort(), removed: removed.sort() };
}

async function restoreText(filePath, priorText) {
  if (priorText === null) await fs.rm(filePath, { force: true });
  else await replaceFile(filePath, priorText);
}

async function readTextOrNull(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function applyCandidate(candidate, {
  homeDirectory = homedir(),
  simulateFailureAfterInstalls = null,
} = {}) {
  const paths = resolvePaths(homeDirectory);
  const state = await readJson(paths.statePath, null);
  if (!state) throw new Error("No managed installation state exists. Run setup after the documented npx install command.");
  if (state.version !== STATE_VERSION || state.source !== HUB_REPOSITORY) throw new Error("Managed installation state has an unsupported owner or version.");

  const lock = await readLock(paths);
  const drift = await inspectManagedInstall(paths, state, lock);
  if (drift.length) throw new Error(`Refusing to overwrite ownership drift:\n- ${drift.join("\n- ")}`);
  if (state.installedCommit === candidate.commit) {
    const result = { status: "no-changes", commit: candidate.commit, added: [], modified: [], removed: [] };
    await recordLastRun(paths, { success: true, ...result });
    return result;
  }

  const changes = compareState(state, candidate);
  const previousNames = new Set(Object.keys(state.skills));
  for (const skill of candidate.skills) {
    const target = path.join(paths.skillsRoot, skill.name);
    if (!previousNames.has(skill.name) && await exists(target)) {
      throw new Error(`${skill.name}: a new Hub skill collides with an unmanaged global skill`);
    }
  }

  const releasePath = await materializeRelease(candidate, paths);
  const transactionRoot = path.join(paths.transactionsRoot, randomUUID());
  const stageRoot = path.join(transactionRoot, "stage");
  const backupRoot = path.join(transactionRoot, "backup");
  await fs.mkdir(stageRoot, { recursive: true });
  await fs.mkdir(backupRoot, { recursive: true });
  for (const skill of candidate.skills) {
    await fs.cp(path.join(releasePath, "skills", skill.name), path.join(stageRoot, skill.name), { recursive: true, force: false });
  }

  const previousStateText = await readTextOrNull(paths.statePath);
  const previousLockText = await readTextOrNull(paths.lockPath);
  const movedOld = [];
  const installedNew = [];
  let metadataStarted = false;

  try {
    await fs.mkdir(paths.skillsRoot, { recursive: true });
    for (const name of previousNames) {
      const target = path.join(paths.skillsRoot, safeName(name));
      const backup = path.join(backupRoot, name);
      await fs.rename(target, backup);
      movedOld.push(name);
    }
    for (const skill of candidate.skills) {
      const staged = path.join(stageRoot, skill.name);
      const target = path.join(paths.skillsRoot, skill.name);
      await fs.rename(staged, target);
      installedNew.push(skill.name);
      if (simulateFailureAfterInstalls !== null && installedNew.length >= simulateFailureAfterInstalls) {
        throw new Error("Simulated transactional installation failure");
      }
    }
    for (const skill of candidate.skills) {
      const installedHash = await hashDirectory(path.join(paths.skillsRoot, skill.name));
      if (installedHash !== skill.folderHash) throw new Error(`${skill.name}: staged installation hash mismatch`);
    }

    metadataStarted = true;
    const now = new Date().toISOString();
    const nextLock = structuredClone(lock);
    nextLock.version = Math.max(3, Number(nextLock.version) || 3);
    nextLock.skills ||= {};
    for (const name of changes.removed) {
      if (isHubOwnedLockEntry(nextLock.skills[name])) delete nextLock.skills[name];
    }
    for (const skill of candidate.skills) {
      nextLock.skills[skill.name] = lockEntryFor(skill, nextLock.skills[skill.name], now);
    }
    await writeJson(paths.lockPath, nextLock);
    await writeJson(paths.statePath, candidateState(candidate, releasePath));

    const result = {
      status: "updated",
      previousCommit: state.installedCommit,
      commit: candidate.commit,
      ...changes,
    };
    await recordLastRun(paths, { success: true, ...result });
    await fs.rm(transactionRoot, { recursive: true, force: true });
    return result;
  } catch (error) {
    for (const name of installedNew.reverse()) {
      await fs.rm(path.join(paths.skillsRoot, name), { recursive: true, force: true }).catch(() => {});
    }
    for (const name of movedOld.reverse()) {
      const backup = path.join(backupRoot, name);
      const target = path.join(paths.skillsRoot, name);
      if (await exists(backup) && !(await exists(target))) await fs.rename(backup, target).catch(() => {});
    }
    if (metadataStarted) {
      await restoreText(paths.lockPath, previousLockText).catch(() => {});
      await restoreText(paths.statePath, previousStateText).catch(() => {});
    }
    await recordLastRun(paths, {
      success: false,
      status: "failed",
      retainedCommit: state.installedCommit,
      error: error.message,
    }).catch(() => {});
    await fs.rm(transactionRoot, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

export async function catalogStatus({ homeDirectory = homedir(), checkRemote = true } = {}) {
  const paths = resolvePaths(homeDirectory);
  const state = await readJson(paths.statePath, null);
  const lastRun = await readJson(paths.lastRunPath, null);
  const lock = await readLock(paths);
  const drift = state ? await inspectManagedInstall(paths, state, lock) : ["managed setup has not been completed"];
  let remoteCommit = null;
  let remoteError = null;
  if (checkRemote) {
    try {
      const output = run("git", ["ls-remote", HUB_URL, "refs/heads/main"]);
      remoteCommit = output.split(/\s+/, 1)[0] || null;
    } catch (error) {
      remoteError = error.message;
    }
  }
  return {
    source: HUB_REPOSITORY,
    installedCommit: state?.installedCommit || null,
    remoteCommit,
    updateAvailable: Boolean(state?.installedCommit && remoteCommit && state.installedCommit !== remoteCommit),
    managedSkillCount: state ? Object.keys(state.skills || {}).length : 0,
    discoverable: drift.length === 0,
    drift,
    lastRun,
    remoteError,
  };
}

async function runRemoteCommand(command) {
  const { temporaryRoot, candidate } = await cloneMain();
  try {
    return command === "setup" ? await registerInstalledCatalog(candidate) : await applyCandidate(candidate);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true }).catch(() => {});
  }
}

function printResult(result) {
  if (result.status === "no-changes") {
    console.log(`NO_CHANGES ${result.commit}`);
    return;
  }
  if (result.status === "registered") {
    console.log(`REGISTERED ${result.commit}`);
    return;
  }
  console.log(`UPDATED ${result.previousCommit} -> ${result.commit}`);
  console.log(`ADDED ${result.added.length ? result.added.join(", ") : "none"}`);
  console.log(`MODIFIED ${result.modified.length ? result.modified.join(", ") : "none"}`);
  console.log(`REMOVED ${result.removed.length ? result.removed.join(", ") : "none"}`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const json = args.includes("--json");
  if (!command || !["setup", "update", "status"].includes(command)) {
    throw new Error("Usage: manage-shared-skills.mjs <setup|update|status> [--json]");
  }
  if (command === "status") {
    const result = await catalogStatus();
    if (json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`SOURCE ${result.source}`);
      console.log(`INSTALLED ${result.installedCommit || "not-registered"}`);
      console.log(`REMOTE ${result.remoteCommit || "unavailable"}`);
      console.log(`UPDATE_AVAILABLE ${result.updateAvailable ? "yes" : "no"}`);
      console.log(`MANAGED_SKILLS ${result.managedSkillCount}`);
      console.log(`DISCOVERABLE ${result.discoverable ? "yes" : "no"}`);
      if (result.drift.length) console.log(`DRIFT ${result.drift.join("; ")}`);
      if (result.remoteError) console.log(`REMOTE_ERROR ${result.remoteError}`);
    }
    return;
  }
  const result = await runRemoteCommand(command);
  if (json) console.log(JSON.stringify(result, null, 2));
  else printResult(result);
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedAsScript) {
  main().catch((error) => {
    console.error(`FAILED ${error.message}`);
    process.exitCode = 1;
  });
}
