import assert from 'node:assert/strict';
import test from 'node:test';
import { auditSkills } from './audit-skills.mjs';
import { inventory, root } from './upstreams.mjs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

test('every active skill is inventoried and named references resolve or have explicit host classifications', async () => {
  const report = await auditSkills();
  assert.ok(report.skills.length > 0);
  assert.deepEqual(report.missingLinks, []);
  assert.deepEqual(report.unresolvedSkills, []);
  assert.ok(report.classifiedReferences.some(reference => reference.name === 'create-skill'));
  assert.ok(report.classifiedReferences.some(reference => reference.name === 'visualize'));
  for (const name of ['deslop', 'control-cli', 'control-ui', 'verify-this']) {
    assert.equal(report.skills.filter(skill => skill.name === name).length, 1);
  }
});

test('a valid distribution with a newly broken link and unknown skill is not reported as resolved', async t => {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'skills-audit-test-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  for (const name of ['plugins', 'patches', '.claude-plugin', 'upstreams.json', 'upstreams.lock.json', 'skills-manifest.json', 'skills-router.json']) {
    await fs.cp(path.join(root, name), path.join(base, name), { recursive: true });
  }
  const file = path.join(base, 'plugins/pstack/skills/poteto-mode/SKILL.md');
  await fs.appendFile(file, '\nRead [required tool](./missing-tool.md), then use the **missing-example-skill** skill.\n');
  const lockPath = path.join(base, 'upstreams.lock.json');
  const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
  lock.sources.find(source => source.name === 'pstack').files = await inventory(path.join(base, 'plugins/pstack'));
  await fs.writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
  const report = await auditSkills(base);
  assert.equal(report.missingLinks.length, 1);
  assert.equal(report.missingLinks[0].target, './missing-tool.md');
  assert.equal(report.unresolvedSkills.length, 1);
  assert.equal(report.unresolvedSkills[0].name, 'missing-example-skill');
});
