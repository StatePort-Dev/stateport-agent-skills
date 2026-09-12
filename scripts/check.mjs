import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSkill, validateRegistry, validateRelativeLink } from './validate.mjs';
import { syncCodexSkill } from './generate-codex-plugin.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const skip = new Set(['.git', '.gradle', '.intellijPlatform', 'node_modules', 'dist', 'artifacts', 'coverage', 'build']);
const all = [];
function walk(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (skip.has(item.name)) continue;
    const absolute = path.join(directory, item.name);
    if (item.isSymbolicLink()) { failures.push(`${path.relative(root, absolute)}: symlinks need explicit review`); continue; }
    if (item.isDirectory()) walk(absolute); else all.push(absolute);
  }
}
walk(root);
const relative = p => path.relative(root, p).split(path.sep).join('/');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const add = (name, errors) => failures.push(...errors.map(e => `${name}: ${e}`));
const required = ['README.md','LICENSE','AGENTS.md','CONTRIBUTING.md','SECURITY.md','CHANGELOG.md',
  'providers/registry.json','skills/stateport-debugging/SKILL.md','.github/workflows/ci.yml'];
for (const name of required) if (!fs.existsSync(path.join(root, name))) failures.push(`Missing ${name}`);
for (const name of syncCodexSkill(root, true)) failures.push(`plugins/stateport/${name}: stale generated copy`);

for (const absolute of all) {
  const name = relative(absolute);
  if (fs.statSync(absolute).size > 200_000) { failures.push(`${name}: oversized source file needs review`); continue; }
  if (/\.env(?:\.|$)/.test(path.basename(name)) || /\.(pem|key|p12|pfx|har|zip|sqlite|db)$/i.test(name)) {
    failures.push(`${name}: prohibited public artifact type`);
  }
  const content = fs.readFileSync(absolute, 'utf8');
  if (content.includes('\0') || content.includes('\uFFFD')) failures.push(`${name}: binary or invalid UTF-8 source`);
  if (!content.endsWith('\n')) failures.push(`${name}: missing final newline`);
  // Small defense-in-depth guard, not a complete secret scanner.
  const guards = [
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    new RegExp('github\\.com/' + 'redvoron/' + 'scenariodeck(?:[/#?]|$)')
  ];
  if (guards.some(pattern => pattern.test(content))) failures.push(`${name}: possible secret or private-product reference; inspect locally`);
  if (path.basename(name) === 'SKILL.md') add(name, validateSkill(content, path.basename(path.dirname(absolute))));
  if (name.endsWith('.md')) {
    // Repository convention: inline Markdown links, no nested-parenthesis paths.
    const links = [...content.matchAll(/\[[^\]\n]*\]\(([^\s)]+)\)/g)].map(m => m[1]);
    const skillRoot = name.startsWith('skills/') ? path.join(root, ...name.split('/').slice(0, 2)) : root;
    for (const href of links) {
      const errors = validateRelativeLink(href, path.dirname(absolute), skillRoot);
      add(name, errors);
      if (errors.length || /^https?:\/\//i.test(href) || href.startsWith('#')) continue;
      const target = path.resolve(path.dirname(absolute), decodeURIComponent(href.split('#')[0].split('?')[0]));
      if (!fs.existsSync(target)) failures.push(`${name}: missing linked file ${href}`);
    }
  }
  if (name.endsWith('.json')) { try { JSON.parse(content); } catch { failures.push(`${name}: invalid JSON`); } }
}

try {
  const registry = JSON.parse(read('providers/registry.json'));
  const errors = validateRegistry(registry);
  add('providers/registry.json', errors);
  if (!errors.length) for (const row of registry.providers) {
    for (const target of [row.guide, ...row.evidence.map(e => e.report)]) {
      const linkErrors = validateRelativeLink(target, root, root);
      add(row.id, linkErrors);
      if (!linkErrors.length && !fs.existsSync(path.resolve(root, target))) failures.push(`${row.id}: missing ${target}`);
    }
  }
  const pkg = JSON.parse(read('package.json'));
  if (pkg.private !== true) failures.push('package.json: npm publication guard must remain enabled');
  const cases = JSON.parse(read('tests/evaluations/cases.json'));
  if (cases.schemaVersion !== 1 || !Array.isArray(cases.cases)) throw new Error('Invalid evaluation inventory');
  const ids = new Set();
  for (const row of cases.cases) {
    if (!row.id || ids.has(row.id) || !row.prompt || !Array.isArray(row.expected) || !row.expected.length || row.status !== 'not_run') {
      failures.push('Evaluation inventory must contain unique planned cases, not fabricated run results');
    }
    ids.add(row.id);
  }
  const workflow = read('.github/workflows/ci.yml');
  if (!/contents: read/.test(workflow) || /pull_request_target|secrets\./.test(workflow)) failures.push('CI must remain read-only and secret-free');
  for (const match of workflow.matchAll(/uses: ([^\s]+)/g)) {
    if (!/^[^@]+@[a-f0-9]{40}$/.test(match[1])) failures.push('CI actions must be pinned to reviewed commit SHAs');
  }
} catch (error) { failures.push(`Repository metadata validation failed: ${error.message}`); }

if (failures.length) {
  console.error(failures.map(e => `FAIL ${e}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`PASS structural checks: ${all.length} files; host/runtime evaluations NOT RUN`);
}
