import assert from 'node:assert/strict';
import { test } from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { configuration, inventory, sync, verify } from './upstreams.mjs';

const write = async (file, value) => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, value); };
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
function git(cwd, ...args) { return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
async function fixture(t) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-test-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const base = path.join(tmp, 'collection');
  const upstream = path.join(tmp, 'upstream');
  const source = { name: 'pstack', repository: 'cursor/plugins', ref: 'main', path: 'distribution', destination: 'plugins/pstack', license: 'MIT' };
  const config = { schemaVersion: 1, sources: [source] };
  await write(path.join(base, 'upstreams.json'), encode(config));
  await write(path.join(base, '.claude-plugin/marketplace.json'), encode({ name: 'test', plugins: [{ name: 'pstack', source: './plugins/pstack' }] }));
  const dir = path.join(upstream, 'distribution');
  await write(path.join(dir, '.claude-plugin/plugin.json'), encode({ name: 'pstack', version: '1.0.0', license: 'MIT' }));
  await write(path.join(dir, 'LICENSE'), 'MIT License\nPermission is hereby granted\n');
  await write(path.join(dir, 'skills/demo/SKILL.md'), '---\nname: demo\ndescription: >-\n  A multi-line\n  description.\ndisable-model-invocation: true\n---\n# Demo\n');
  await write(path.join(dir, 'assets/image.bin'), Buffer.from([0, 255, 192, 128]));
  await write(path.join(dir, 'scripts/probe.sh'), '#!/bin/sh\nexit 91\n');
  await fs.chmod(path.join(dir, 'scripts/probe.sh'), 0o755);
  git(upstream, 'init', '-b', 'main');
  git(upstream, 'config', 'user.name', 'Fixture');
  git(upstream, 'config', 'user.email', 'fixture@example.com');
  const commit = () => { git(upstream, 'add', '.'); git(upstream, 'commit', '-m', 'fixture'); };
  commit();
  return { base, upstream, dir, config, commit, run: () => sync(base, { pstack: upstream }) };
}

test('copies complete plugin bytes and modes, parses multiline YAML, does not execute imported scripts', async t => {
  const f = await fixture(t);
  const result = await f.run();
  assert.equal(result.schemaVersion, 2);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].description, 'A multi-line description.');
  assert.equal(result.skills[0].disableModelInvocation, true);
  assert.equal(result.sources[0].revision, git(f.upstream, 'rev-parse', 'HEAD'));
  assert.deepEqual(await inventory(path.join(f.base, 'plugins/pstack')), await inventory(f.dir));
  await verify(f.base);
});

test('repeat sync is byte-idempotent; upstream deletion and replacement converge', async t => {
  const f = await fixture(t);
  await f.run();
  const before = await inventory(f.base);
  await f.run();
  assert.deepEqual(await inventory(f.base), before);
  await fs.rm(path.join(f.dir, 'skills/demo'), { recursive: true });
  await write(path.join(f.dir, 'skills/new-skill/SKILL.md'), '---\nname: new-skill\ndescription: replacement\n---\n');
  f.commit();
  const result = await f.run();
  assert.deepEqual(result.skills.map(s => s.name), ['new-skill']);
  await assert.rejects(fs.access(path.join(f.base, 'plugins/pstack/skills/demo')), { code: 'ENOENT' });
});

test('rejects local vendor edits before replacing anything', async t => {
  const f = await fixture(t);
  await f.run();
  await fs.appendFile(path.join(f.base, 'plugins/pstack/LICENSE'), 'local edit');
  const before = await inventory(f.base);
  await assert.rejects(f.run(), /Local upstream edits/);
  assert.deepEqual(await inventory(f.base), before);
});

test('malformed candidate leaves existing distribution unchanged', async t => {
  const f = await fixture(t);
  await f.run();
  const before = await inventory(f.base);
  await write(path.join(f.dir, 'skills/demo/SKILL.md'), 'not a skill');
  f.commit();
  await assert.rejects(f.run(), /frontmatter/);
  assert.deepEqual(await inventory(f.base), before);
});

test('dirty upstream is rejected rather than claiming its files belong to a commit', async t => {
  const f = await fixture(t);
  await fs.appendFile(path.join(f.dir, 'LICENSE'), 'uncommitted');
  await assert.rejects(f.run(), /uncommitted/);
});

test('symlinks in imported tree are rejected', async t => {
  const f = await fixture(t);
  await fs.symlink('../../outside', path.join(f.dir, 'link'));
  f.commit();
  await assert.rejects(f.run(), /Unsupported file type/);
});

test('source traversal, duplicate names, and unreviewed licenses fail', async t => {
  const f = await fixture(t);
  for (const mutate of [c => { c.sources[0].path = '../escape'; }, c => { c.sources.push(c.sources[0]); }, c => { c.sources[0].destination = '../outside'; }, c => { c.sources[0].license = 'unknown'; }]) {
    const config = structuredClone(f.config);
    mutate(config);
    await write(path.join(f.base, 'upstreams.json'), encode(config));
    await assert.rejects(configuration(f.base));
  }
});

test('empty skills cannot become a passing catalog', async t => {
  const f = await fixture(t);
  await fs.rm(path.join(f.dir, 'skills/demo'), { recursive: true });
  f.commit();
  await assert.rejects(f.run(), /no skills/);
});

test('stale indexes and marketplace mismatch are detected', async t => {
  const f = await fixture(t);
  await f.run();
  const router = path.join(f.base, 'skills-router.json');
  const original = await fs.readFile(router);
  await write(router, '{}\n');
  await assert.rejects(verify(f.base), /Stale generated/);
  await write(router, original);
  await write(path.join(f.base, '.claude-plugin/marketplace.json'), encode({ plugins: [] }));
  await assert.rejects(verify(f.base), /Marketplace differs/);
});

test('extra files, executable-bit changes, and legacy root skills fail validation', async t => {
  const f = await fixture(t);
  await f.run();
  const extra = path.join(f.base, 'plugins/pstack/extra');
  await write(extra, 'untracked material');
  await assert.rejects(verify(f.base), /differs from lock/);
  await fs.rm(extra);
  const executable = path.join(f.base, 'plugins/pstack/scripts/probe.sh');
  await fs.chmod(executable, 0o644);
  await assert.rejects(verify(f.base), /differs from lock/);
  await fs.chmod(executable, 0o755);
  await fs.mkdir(path.join(f.base, 'skills'));
  await assert.rejects(verify(f.base), /Legacy root/);
});

test('ignored files cannot leak into a pinned upstream copy', async t => {
  const f = await fixture(t);
  await write(path.join(f.upstream, '.gitignore'), 'distribution/private.txt\n');
  f.commit();
  await write(path.join(f.dir, 'private.txt'), 'not part of upstream');
  await assert.rejects(f.run(), /ignored files/);
});

test('committed executable mode is enforced even when git ignores mode drift', async t => {
  const f = await fixture(t);
  git(f.upstream, 'config', 'core.fileMode', 'false');
  await fs.chmod(path.join(f.dir, 'scripts/probe.sh'), 0o644);
  await assert.rejects(f.run(), /mode differ/);
});
