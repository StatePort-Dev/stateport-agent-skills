import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function syncCodexSkill(root = repositoryRoot, check = false) {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'integration.json'), 'utf8'));
  if (metadata.schemaVersion !== 1 || !/^0\.\d+\.\d+(?:-(?:alpha|beta)\.\d+)?$/.test(metadata.integrationVersion) ||
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
  // Each entrypoint is canonical; shared references have one authoring location.
  // Copy references into each skill so raw single-skill installs remain portable.
  const shared = 'skills/stateport-debugging/references';
  const referenceContent = new Map(fs.readdirSync(path.join(root, shared)).map(name => [name, fs.readFileSync(path.join(root, shared, name))]));
  // One lazy load includes authorization from its single canonical source.
  referenceContent.set('fix-verify.md', Buffer.from('<!-- Generated from authorization.md and fix-verify-flow.md. -->\n\n' + referenceContent.get('authorization.md').toString() + '\n' + referenceContent.get('fix-verify-flow.md').toString()));
  const references = [...referenceContent.keys()].sort();
  const skills = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter(item => item.isDirectory() && fs.existsSync(path.join(root, 'skills', item.name, 'SKILL.md')))
    .map(item => item.name).sort();
  for (const skill of skills) {
    const canonical = `skills/${skill}`;
    for (const target of [canonical, `plugins/stateport/skills/${skill}`, `extensions/vscode/skills/${skill}`]) {
      put(`${target}/SKILL.md`, fs.readFileSync(path.join(root, canonical, 'SKILL.md')));
      put(`${target}/integration.json`, metadataContent);
      for (const name of references) put(`${target}/references/${name}`, referenceContent.get(name));
      const referenceDir = path.join(root, target, 'references');
      if (fs.existsSync(referenceDir)) {
        for (const name of fs.readdirSync(referenceDir)) {
          if (references.includes(name)) continue;
          if (check) mismatches.push(`${target}/references/${name}`);
          else fs.rmSync(path.join(referenceDir, name), { recursive: true, force: true });
        }
      }
    }
  }
  const vscodePath = 'extensions/vscode/package.json';
  const vscode = JSON.parse(fs.readFileSync(path.join(root, vscodePath), 'utf8'));
  vscode.version = metadata.integrationVersion;
  vscode.contributes.chatSkills = skills.map(skill => ({ path: `./skills/${skill}/SKILL.md` }));
  vscode.files = [...vscode.files.filter(name => !name.startsWith('skills/')), 'skills/'];
  put(vscodePath, `${JSON.stringify(vscode, null, 2)}\n`);

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
