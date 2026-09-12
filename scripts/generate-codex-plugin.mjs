import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function syncCodexSkill(root = repositoryRoot, check = false) {
  const source = path.join(root, 'skills/stateport-debugging');
  const destination = path.join(root, 'plugins/stateport/skills/stateport-debugging');
  const sourceFiles = ['SKILL.md', ...fs.readdirSync(path.join(source, 'references')).map(name => `references/${name}`).sort()];
  const mismatches = [];
  for (const name of sourceFiles) {
    const input = path.join(source, name);
    const output = path.join(destination, name);
    if (!fs.statSync(input).isFile()) throw new Error(`Not a canonical file: ${name}`);
    const content = fs.readFileSync(input);
    if (check) {
      if (!fs.existsSync(output) || !fs.statSync(output).isFile() || !fs.readFileSync(output).equals(content)) mismatches.push(`skills/stateport-debugging/${name}`);
    } else {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, content);
    }
  }
  if (fs.existsSync(destination)) {
    const expected = new Set(sourceFiles);
    const actual = ['SKILL.md', ...fs.readdirSync(path.join(destination, 'references')).map(name => `references/${name}`)];
    for (const name of actual) {
      if (expected.has(name)) continue;
      if (check) mismatches.push(`skills/stateport-debugging/${name}`);
      else fs.rmSync(path.join(destination, name));
    }
  }
  const setupSource = path.join(root, 'scripts/setup-codex-mcp.mjs');
  const setupDestination = path.join(root, 'plugins/stateport/scripts/setup-codex-mcp.mjs');
  const setupContent = fs.readFileSync(setupSource);
  if (check) {
    if (!fs.existsSync(setupDestination) || !fs.readFileSync(setupDestination).equals(setupContent)) {
      mismatches.push('scripts/setup-codex-mcp.mjs');
    }
  } else {
    fs.mkdirSync(path.dirname(setupDestination), { recursive: true });
    fs.writeFileSync(setupDestination, setupContent);
  }
  return mismatches;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const mismatches = syncCodexSkill(repositoryRoot, check);
  if (mismatches.length) {
    console.error(`Codex skill copy is stale: ${mismatches.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(check ? 'PASS Codex skill copy is fresh' : 'Generated Codex skill copy');
  }
}
