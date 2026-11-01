import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function relative(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.split('/').some(p => !p || p === '.' || p === '..') || path.isAbsolute(value)) {
    throw new Error(`Unsafe relative path: ${value}`);
  }
  return value;
}

export async function configuration(base) {
  const config = await json(path.join(base, 'upstreams.json'));
  if (config.schemaVersion !== 1 || !Array.isArray(config.sources) || !config.sources.length) throw new Error('Empty or invalid upstream configuration');
  const names = new Set();
  for (const source of config.sources) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.name) || names.has(source.name)) throw new Error('Invalid or duplicate source name');
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository) || typeof source.ref !== 'string' || !source.ref || source.ref.startsWith('-')) throw new Error('Invalid upstream repository or ref');
    relative(source.path);
    if (source.destination !== `plugins/${source.name}` || source.license !== 'MIT') throw new Error('Source needs a dedicated plugin destination and reviewed MIT license');
    names.add(source.name);
  }
  return config;
}

export async function inventory(directory) {
  const files = {};
  async function walk(current, prefix = '') {
    for (const entry of (await fs.readdir(current, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const name = prefix + entry.name;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full, `${name}/`);
      else if (entry.isFile()) {
        files[name] = { sha256: createHash('sha256').update(await fs.readFile(full)).digest('hex'), executable: Boolean((await fs.stat(full)).mode & 0o111) };
      } else throw new Error(`Unsupported file type: ${name}`);
    }
  }
  await walk(directory);
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, 'en')));
}

async function describe(directory, source) {
  const plugin = await json(path.join(directory, '.claude-plugin/plugin.json'));
  if (plugin.name !== source.name || plugin.license !== source.license || !plugin.version) throw new Error('Plugin identity/license mismatch');
  const license = await fs.readFile(path.join(directory, 'LICENSE'), 'utf8');
  if (!license.includes('MIT License') || !license.includes('Permission is hereby granted')) throw new Error('Missing upstream MIT license');
  const skills = [];
  for (const entry of (await fs.readdir(path.join(directory, 'skills'), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (!entry.isDirectory()) continue;
    const file = path.join(directory, 'skills', entry.name, 'SKILL.md');
    const text = await fs.readFile(file, 'utf8');
    const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!front) throw new Error(`Missing skill frontmatter: ${entry.name}`);
    const fields = parse(front[1]);
    if (fields.name !== entry.name || typeof fields.description !== 'string' || !fields.description.trim()) throw new Error(`Invalid skill: ${entry.name}`);
    skills.push({ name: fields.name, source: source.name, entrypoint: `${source.destination}/skills/${entry.name}/SKILL.md`, description: fields.description.trim(), disableModelInvocation: fields['disable-model-invocation'] === true });
  }
  if (!skills.length) throw new Error('Upstream plugin has no skills');
  return { version: plugin.version, skills };
}

async function generated(base, config) {
  const lock = await json(path.join(base, 'upstreams.lock.json'));
  if (lock.schemaVersion !== 1 || !Array.isArray(lock.sources) || lock.sources.length !== config.sources.length) throw new Error('Invalid upstream lock');
  const skills = [];
  for (let i = 0; i < config.sources.length; i++) {
    const source = config.sources[i];
    const pin = lock.sources[i];
    for (const key of ['name', 'repository', 'ref', 'path', 'destination', 'license']) {
      if (pin[key] !== source[key]) throw new Error(`Source configuration drift: ${key}`);
    }
    if (!/^[a-f0-9]{40}$/.test(pin.revision)) throw new Error('Invalid source revision');
    const dir = path.join(base, source.destination);
    const actual = await inventory(dir);
    if (encode(actual) !== encode(pin.files)) throw new Error(`Vendored tree differs from lock: ${source.name}`);
    const description = await describe(dir, source);
    if (description.version !== pin.version) throw new Error('Version differs from lock');
    skills.push(...description.skills);
  }
  return {
    manifest: { schemaVersion: 2, repository: 'starrybamboo/agent-skills', defaultBranch: 'main', distribution: 'claude-code-plugins', sources: lock.sources.map(({ files, ...source }) => source), skills },
    router: { schemaVersion: 2, repository: 'starrybamboo/agent-skills', defaultBranch: 'main', skills },
  };
}

export async function verify(base = root) {
  const config = await configuration(base);
  const output = await generated(base, config);
  for (const [file, value] of [['skills-manifest.json', output.manifest], ['skills-router.json', output.router]]) {
    if (await fs.readFile(path.join(base, file), 'utf8') !== encode(value)) throw new Error(`Stale generated file: ${file}`);
  }
  const marketplace = await json(path.join(base, '.claude-plugin/marketplace.json'));
  const expected = config.sources.map(s => ({ name: s.name, source: `./${s.destination}` }));
  if (encode(marketplace.plugins.map(({ name, source }) => ({ name, source }))) !== encode(expected)) throw new Error('Marketplace differs from upstream configuration');
  const pluginNames = (await fs.readdir(path.join(base, 'plugins'))).sort();
  if (encode(pluginNames) !== encode(config.sources.map(s => s.name).sort())) throw new Error('Unexpected plugin directory');
  try { await fs.access(path.join(base, 'skills')); throw new Error('Legacy root skills directory must not be distributed'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return output.manifest;
}

export async function sync(base = root, localSources = {}) {
  const config = await configuration(base);
  let previous;
  try { previous = await json(path.join(base, 'upstreams.lock.json')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous) {
    for (const pin of previous.sources) {
      if (pin.destination !== `plugins/${pin.name}` || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pin.name)) throw new Error('Invalid previous source destination');
      if (!config.sources.some(source => source.destination === pin.destination)) throw new Error('Remove a retired upstream explicitly before changing the source configuration');
      if (encode(await inventory(path.join(base, pin.destination))) !== encode(pin.files)) throw new Error(`Local upstream edits would be overwritten: ${pin.name}`);
    }
  }
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-upstream-'));
  const pins = [];
  try {
    await fs.mkdir(path.join(stage, 'plugins'));
    for (const source of config.sources) {
      let checkout = localSources[source.name];
      if (!checkout) {
        checkout = path.join(stage, `checkout-${source.name}`);
        execFileSync('git', ['clone', '--quiet', '--depth=1', '--branch', source.ref, '--', `https://github.com/${source.repository}.git`, checkout], { stdio: 'pipe' });
      }
      const revision = git(checkout, 'rev-parse', 'HEAD');
      if (git(checkout, 'status', '--porcelain', '--untracked-files=all', '--', source.path)) throw new Error('Upstream checkout has uncommitted changes');
      const from = path.join(checkout, source.path);
      const resolved = await fs.realpath(from);
      if (!resolved.startsWith(`${await fs.realpath(checkout)}${path.sep}`)) throw new Error('Upstream path escapes checkout');
      const files = await inventory(from);
      const tracked = git(checkout, 'ls-tree', '-r', '-z', 'HEAD', '--', source.path).split('\0').filter(Boolean);
      const expected = {};
      for (const entry of tracked) {
        const match = entry.match(/^(100644|100755) blob ([a-f0-9]{40})\t([\s\S]+)$/);
        if (!match) throw new Error('Unsupported upstream Git entry');
        const name = match[3].slice(source.path.length + 1);
        const bytes = await fs.readFile(path.join(from, name));
        const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
        if (blob !== match[2] || files[name]?.executable !== (match[1] === '100755')) throw new Error('Upstream bytes or mode differ from committed source');
        expected[name] = true;
      }
      if (Object.keys(files).length !== Object.keys(expected).length) throw new Error('Untracked or ignored files in upstream distribution');
      const description = await describe(from, source);
      const to = path.join(stage, source.destination);
      await fs.cp(from, to, { recursive: true, preserveTimestamps: true });
      pins.push({ ...source, revision, version: description.version, files });
    }
    await fs.writeFile(path.join(stage, 'upstreams.json'), encode(config));
    await fs.writeFile(path.join(stage, 'upstreams.lock.json'), encode({ schemaVersion: 1, sources: pins }));
    await fs.mkdir(path.join(stage, '.claude-plugin'));
    await fs.copyFile(path.join(base, '.claude-plugin/marketplace.json'), path.join(stage, '.claude-plugin/marketplace.json'));
    const output = await generated(stage, config);
    await fs.writeFile(path.join(stage, 'skills-manifest.json'), encode(output.manifest));
    await fs.writeFile(path.join(stage, 'skills-router.json'), encode(output.router));
    await verify(stage);
    await fs.mkdir(path.join(base, 'plugins'), { recursive: true });
    for (const source of config.sources) {
      await fs.rm(path.join(base, source.destination), { recursive: true, force: true });
      await fs.cp(path.join(stage, source.destination), path.join(base, source.destination), { recursive: true, preserveTimestamps: true });
    }
    for (const file of ['upstreams.lock.json', 'skills-manifest.json', 'skills-router.json']) await fs.copyFile(path.join(stage, file), path.join(base, file));
    return await verify(base);
  } finally {
    await fs.rm(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'verify' && args.length === 0) {
    const manifest = await verify();
    console.log(`Verified ${manifest.skills.length} skills against pinned file hashes and marketplace.`);
  } else if (command === 'sync' && (args.length === 0 || (args.length === 2 && args[0] === '--pstack-checkout'))) {
    const manifest = await sync(root, args.length ? { pstack: path.resolve(args[1]) } : {});
    console.log(`Synced ${manifest.skills.length} skills without executing upstream scripts.`);
  } else throw new Error('Usage: upstreams.mjs verify | sync [--pstack-checkout PATH]');
}
