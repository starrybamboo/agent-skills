import assert from 'node:assert/strict';
import { test } from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { root } from './upstreams.mjs';
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
async function fixture(t) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'publish-test-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const repo = path.join(tmp, 'repo');
  const remote = path.join(tmp, 'remote');
  const bin = path.join(tmp, 'bin');
  await fs.mkdir(repo); await fs.mkdir(remote); await fs.mkdir(bin);
  git(remote, 'init', '--bare', '-b', 'main');
  git(repo, 'init', '-b', 'main');
  git(repo, 'config', 'user.name', 'Test'); git(repo, 'config', 'user.email', 'test@example.com');
  await fs.mkdir(path.join(repo, 'plugins'));
  await fs.writeFile(path.join(repo, 'plugins/example'), 'one');
  await fs.writeFile(path.join(repo, 'upstreams.lock.json'), JSON.stringify({ sources: [{ name: 'pstack', version: '1', repository: 'cursor/plugins', revision: 'a'.repeat(40) }] }));
  for (const file of ['skills-manifest.json', 'skills-router.json']) await fs.writeFile(path.join(repo, file), '{}');
  git(repo, 'add', '.'); git(repo, 'commit', '-m', 'baseline'); git(repo, 'remote', 'add', 'origin', remote); git(repo, 'push', '-u', 'origin', 'main');
  const baseline = git(repo, 'rev-parse', 'HEAD');
  git(repo, 'switch', '-c', 'sync/pstack');
  await fs.writeFile(path.join(bin, 'gh'), `#!/usr/bin/env node\nconst fs = require('fs'); const a=process.argv.slice(2); fs.appendFileSync(process.env.GH_LOG, JSON.stringify(a)+'\\n'); if(a[0]==='pr'&&a[1]==='list') console.log(process.env.EXISTING_PR||''); else if(process.env.FAIL_GH) process.exit(1);\n`);
  await fs.chmod(path.join(bin, 'gh'), 0o755);
  const log = path.join(tmp, 'gh.log');
  const run = (extra = {}) => spawnSync('bash', [path.join(root, 'scripts/publish-sync.sh')], { cwd: repo, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GH_LOG: log, GITHUB_REPOSITORY: 'fixture/repo', GITHUB_RUN_ID: '123', ...extra } });
  return { repo, remote, log, baseline, run };
}

test('no-change run neither commits nor opens a PR', async t => {
  const f = await fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.baseline);
  await assert.rejects(fs.access(f.log), { code: 'ENOENT' });
});

test('changes push only the sync branch and create a draft; reruns update the same PR', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.repo, 'plugins/example'), 'two');
  const first = f.run();
  assert.equal(first.status, 0, first.stderr);
  const sha = git(f.repo, 'rev-parse', 'HEAD');
  assert.equal(git(f.remote, 'rev-parse', 'main'), f.baseline);
  assert.equal(git(f.remote, 'rev-parse', 'sync/pstack'), sha);
  const calls = (await fs.readFile(f.log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert(calls.some(a => a[1] === 'create' && a.includes('--draft')));
  const second = f.run({ EXISTING_PR: '7' });
  assert.equal(second.status, 0, second.stderr);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), sha);
  const updated = (await fs.readFile(f.log, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(updated.filter(a => a[1] === 'create').length, 1);
  assert(updated.some(a => a[1] === 'edit' && a[2] === '7'));
});

test('PR permission failure reports nonzero and retry reuses the pushed commit', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.repo, 'plugins/example'), 'two');
  assert.notEqual(f.run({ FAIL_GH: '1' }).status, 0);
  const sha = git(f.repo, 'rev-parse', 'HEAD');
  assert.equal(git(f.remote, 'rev-parse', 'sync/pstack'), sha);
  const retry = f.run();
  assert.equal(retry.status, 0, retry.stderr);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), sha);
});

test('unrelated branch content is never published', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.repo, 'unrelated.txt'), 'do not publish');
  git(f.repo, 'add', '.'); git(f.repo, 'commit', '-m', 'unrelated');
  await fs.writeFile(path.join(f.repo, 'plugins/example'), 'two');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unexpected sync branch/);
  assert.throws(() => git(f.remote, 'rev-parse', 'sync/pstack'));
});

test('publishing from main is rejected before staging or pushing', async t => {
  const f = await fixture(t);
  git(f.repo, 'switch', 'main');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to publish/);
});
