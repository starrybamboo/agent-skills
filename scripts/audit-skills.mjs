import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify, root } from './upstreams.mjs';

const hostReferences = {
  plugin: 'Claude Code host command, not a skill package',
  loop: 'Host scheduling capability; Claude Code has its own loop with different lifecycle limits',
  'create-skill': 'Cursor built-in; no portable implementation bundled in these upstream sources',
  autopilot: 'Cursor built-in mentioned for contrast; pstack uses its own babysit playbook',
  'in-cloud': 'Cursor host command; Claude Code worktree isolation is not a remote VM',
  visualize: 'Host visualization capability referenced by ketchup; not bundled in these sources',
  name: 'Placeholder in the adapter documentation',
  orchestrate: 'Documentation explicitly says this is a playbook, not a standalone skill',
  tmp: 'Filesystem path in an example, not a skill',
};

export async function auditSkills(base = root) {
  const manifest = await verify(base);
  const known = new Set(manifest.skills.map(skill => skill.name));
  const files = new Set();
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name.endsWith('.md')) files.add(file);
    }
  }
  for (const source of manifest.sources) {
    if (!source.adapter) await walk(path.join(base, source.destination));
    else for (const skill of manifest.skills.filter(skill => skill.source === source.name)) await walk(path.dirname(path.join(base, skill.entrypoint)));
  }
  const missingLinks = [], unresolvedSkills = [], classifiedReferences = [], placeholders = [];
  let relativeLinks = 0;
  for (const file of [...files].sort()) {
    const lines = (await fs.readFile(file, 'utf8')).split('\n');
    for (let index = 0; index < lines.length; index++) {
      const at = { file: path.relative(base, file), line: index + 1 };
      for (const match of lines[index].matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
        const target = match[1].split(/\s+"/)[0].split('#')[0];
        if (!target || /^(?:[a-z]+:|\/|~|\$|<)/i.test(target) || target.includes('<') || target.includes('$')) continue;
        relativeLinks++;
        if (target === 'url' && at.file === 'plugins/pstack/skills/why/references/synthesizer-prompt.md') {
          placeholders.push({ ...at, target }); continue;
        }
        try { await fs.access(path.resolve(path.dirname(file), target)); }
        catch (error) { if (error.code !== 'ENOENT') throw error; missingLinks.push({ ...at, target }); }
      }
      for (const match of lines[index].matchAll(/\*\*([a-z][a-z0-9-]+)\*\* skill|`\/([a-z][a-z0-9-]+)`/g)) {
        const name = match[1] ?? match[2];
        if (known.has(name)) continue;
        if (Object.hasOwn(hostReferences, name)) classifiedReferences.push({ ...at, name, classification: hostReferences[name] });
        else unresolvedSkills.push({ ...at, name });
      }
    }
  }
  return { scope: 'static distribution and named-reference audit; not a live host certification',
    sources: manifest.sources.map(({ name, revision, version }) => ({ name, revision, version })),
    skills: manifest.skills.map(({ name, source, entrypoint, disableModelInvocation }) => ({ name, source, entrypoint,
      invocation: disableModelInvocation ? 'explicit-workflow-or-user-invoked' : 'model-invocable' })),
    markdownFiles: files.size, relativeLinks, placeholders, missingLinks, unresolvedSkills, classifiedReferences };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await auditSkills();
  console.log(JSON.stringify(result, null, 2));
  if (result.missingLinks.length || result.unresolvedSkills.length) process.exitCode = 1;
}
