import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function syncCodexSkill(root = repositoryRoot, check = false) {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'integration.json'), 'utf8'));
  if (metadata.schemaVersion !== 1 || !/^0\.\d+\.\d+(?:-alpha\.\d+)?$/.test(metadata.integrationVersion) ||
      !Number.isInteger(metadata.mcpContract?.minimum) || !Number.isInteger(metadata.mcpContract?.maximum) ||
      metadata.mcpContract.minimum < 1 || metadata.mcpContract.maximum < metadata.mcpContract.minimum) {
    throw new Error('Invalid canonical integration metadata');
  }
  const mismatches = [];
  const put = (name, content) => {
    const output = path.join(root, name);
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
    if (fs.existsSync(output) && fs.statSync(output).isFile() && fs.readFileSync(output).equals(bytes)) return;
    if (check) mismatches.push(name);
    else {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, bytes);
    }
  };
  const metadataContent = `${JSON.stringify(metadata, null, 2)}\n`;
  const canonical = 'skills/stateport-debugging';
  const names = ['SKILL.md', 'integration.json', ...fs.readdirSync(path.join(root, canonical, 'references')).map(name => `references/${name}`).sort()];
  put(`${canonical}/integration.json`, metadataContent);
  for (const target of ['plugins/stateport/skills/stateport-debugging', 'extensions/vscode/skills/stateport-debugging']) {
    for (const name of names) {
      const source = name === 'integration.json' ? metadataContent : fs.readFileSync(path.join(root, canonical, name));
      put(`${target}/${name}`, source);
    }
    const referenceDir = path.join(root, target, 'references');
    if (fs.existsSync(referenceDir)) {
      const expected = new Set(names.filter(name => name.startsWith('references/')).map(name => path.basename(name)));
      for (const name of fs.readdirSync(referenceDir)) {
        if (expected.has(name)) continue;
        if (check) mismatches.push(`${target}/references/${name}`);
        else fs.rmSync(path.join(referenceDir, name), { recursive: true, force: true });
      }
    }
  }

  for (const name of ['desktop-mcp-config.mjs', 'compatibility.mjs', 'setup-codex-mcp.mjs', 'setup-claude-mcp.mjs', 'setup-copilot-mcp.mjs', 'setup-cursor-mcp.mjs']) {
    put(`plugins/stateport/scripts/${name}`, fs.readFileSync(path.join(root, 'scripts', name)));
  }
  put('extensions/vscode/scripts/desktop-mcp-config.mjs', fs.readFileSync(path.join(root, 'scripts/desktop-mcp-config.mjs')));
  put('extensions/vscode/LICENSE', fs.readFileSync(path.join(root, 'LICENSE')));

  for (const name of ['package.json', 'plugins/stateport/plugin.json', 'plugins/stateport/.codex-plugin/plugin.json', 'plugins/stateport/.claude-plugin/plugin.json', 'extensions/vscode/package.json']) {
    const original = fs.readFileSync(path.join(root, name), 'utf8');
    if (!/"version": "[^"]+"/.test(original)) throw new Error(`Missing version in ${name}`);
    put(name, original.replace(/"version": "[^"]+"/, `"version": "${metadata.integrationVersion}"`));
  }
  const gradle = 'extensions/jetbrains/build.gradle';
  const gradleText = fs.readFileSync(path.join(root, gradle), 'utf8');
  if (!/^version = '[^']+'$/m.test(gradleText)) throw new Error('Missing JetBrains Gradle version');
  put(gradle, gradleText.replace(/^version = '[^']+'$/m, `version = '${metadata.integrationVersion}'`));
  const descriptor = 'extensions/jetbrains/src/main/resources/META-INF/plugin.xml';
  const descriptorText = fs.readFileSync(path.join(root, descriptor), 'utf8');
  if (!/<version>[^<]+<\/version>/.test(descriptorText)) throw new Error('Missing JetBrains descriptor version');
  put(descriptor, descriptorText.replace(/<version>[^<]+<\/version>/, `<version>${metadata.integrationVersion}</version>`));
  return mismatches;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const mismatches = syncCodexSkill(repositoryRoot, check);
  if (mismatches.length) {
    console.error(`Integration artifacts are stale: ${mismatches.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(check ? 'PASS integration artifacts are fresh' : 'Synchronized integration artifacts');
  }
}
