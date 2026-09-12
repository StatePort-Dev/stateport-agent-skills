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
  const vscodeSkill = path.join(root, 'extensions/vscode/skills/stateport-debugging');
  for (const name of sourceFiles) {
    const input = path.join(source, name);
    const output = path.join(vscodeSkill, name);
    const content = fs.readFileSync(input);
    if (check) {
      if (!fs.existsSync(output) || !fs.statSync(output).isFile() || !fs.readFileSync(output).equals(content)) mismatches.push(`extensions/vscode/skills/stateport-debugging/${name}`);
    } else {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, content);
    }
  }
  for (const [directory, label] of [[destination, 'skills/stateport-debugging'], [vscodeSkill, 'extensions/vscode/skills/stateport-debugging']]) {
    if (fs.existsSync(directory)) {
      const expected = new Set(sourceFiles);
      const actual = ['SKILL.md', ...fs.readdirSync(path.join(directory, 'references')).map(name => `references/${name}`)];
      for (const name of actual) {
        if (expected.has(name)) continue;
        if (check) mismatches.push(`${label}/${name}`);
        else fs.rmSync(path.join(directory, name));
      }
    }
  }
  for (const name of ['desktop-mcp-config.mjs', 'setup-codex-mcp.mjs', 'setup-claude-mcp.mjs', 'setup-copilot-mcp.mjs']) {
    const setupSource = path.join(root, 'scripts', name);
    const setupDestination = path.join(root, 'plugins/stateport/scripts', name);
    const setupContent = fs.readFileSync(setupSource);
    if (check) {
      if (!fs.existsSync(setupDestination) || !fs.readFileSync(setupDestination).equals(setupContent)) {
        mismatches.push(`scripts/${name}`);
      }
    } else {
      fs.mkdirSync(path.dirname(setupDestination), { recursive: true });
      fs.writeFileSync(setupDestination, setupContent);
    }
  }
  const vscodeParser = path.join(root, 'extensions/vscode/scripts/desktop-mcp-config.mjs');
  const codexParser = fs.readFileSync(path.join(root, 'scripts/desktop-mcp-config.mjs'));
  if (check) {
    if (!fs.existsSync(vscodeParser) || !fs.readFileSync(vscodeParser).equals(codexParser)) mismatches.push('extensions/vscode/scripts/desktop-mcp-config.mjs');
  } else {
    fs.mkdirSync(path.dirname(vscodeParser), { recursive: true });
    fs.writeFileSync(vscodeParser, codexParser);
  }
  const vscodeLicense = path.join(root, 'extensions/vscode/LICENSE');
  const license = fs.readFileSync(path.join(root, 'LICENSE'));
  if (check) {
    if (!fs.existsSync(vscodeLicense) || !fs.readFileSync(vscodeLicense).equals(license)) mismatches.push('extensions/vscode/LICENSE');
  } else {
    fs.writeFileSync(vscodeLicense, license);
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
