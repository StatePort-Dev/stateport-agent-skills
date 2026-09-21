import test from 'node:test';
import assert from 'node:assert/strict';
import * as validators from '../scripts/validate.mjs';
import { validateSkill, validateRegistry, validateRelativeLink } from '../scripts/validate.mjs';
const valid = '---\nname: stateport-debugging\ndescription: Use when a browser bug or a State Card requires investigation.\n---\n\n# StatePort debugging\n\nInspect the available capabilities.\n';
const provider = () => ({ id: 'codex-cli', status: 'scaffold', guide: 'providers/codex/README.md', update: { method: 'unverified', automatic: 'unverified', evidenceStatus: 'unverified' }, evidence: [] });

test('accepts a compact canonical skill', () => assert.deepEqual(validateSkill(valid, 'stateport-debugging'), []));
test('requires frontmatter', () => assert.ok(validateSkill('# Hello', 'hello').length));
test('requires matching directory and skill name', () => assert.ok(validateSkill(valid, 'different').length));
test('rejects invalid or consecutive-hyphen names', () => assert.ok(validateSkill(valid.replaceAll('stateport-debugging', 'StatePort--debugging'), 'StatePort--debugging').length));
test('requires nonempty description', () => assert.ok(validateSkill(valid.replace(/description:.*/, 'description: '), 'stateport-debugging').length));
test('bounds description length', () => assert.ok(validateSkill(valid.replace(/description:.*/, `description: ${'a'.repeat(1025)}`), 'stateport-debugging').length));
test('rejects empty skill body', () => assert.ok(validateSkill(valid.slice(0, valid.indexOf('\n\n#')), 'stateport-debugging').length));
test('rejects duplicate metadata', () => assert.ok(validateSkill(valid.replace('description:', 'name: other\ndescription:'), 'stateport-debugging').length));
test('accepts unverified provider scaffold', () => assert.deepEqual(validateRegistry({ schemaVersion: 1, providers: [provider()] }), []));
test('requires a known registry schema version', () => assert.ok(validateRegistry({ schemaVersion: 2, providers: [provider()] }).length));
test('requires unique provider identities', () => assert.ok(validateRegistry({ schemaVersion: 1, providers: [provider(), provider()] }).length));
test('rejects unknown provider status', () => assert.ok(validateRegistry({ schemaVersion: 1, providers: [{ ...provider(), status: 'works-everywhere' }] }).length));
test('rejects unsupported update claims without host evidence', () => assert.ok(validateRegistry({ schemaVersion: 1, providers: [{ ...provider(), update: { method: 'native-auto', automatic: 'yes', evidenceStatus: 'unverified' } }] }).length));
test('verified provider needs evidence', () => assert.ok(validateRegistry({ schemaVersion: 1, providers: [{ ...provider(), status: 'verified' }] }).length));
test('verified evidence must bind host, runtime and skill versions', () => assert.ok(validateRegistry({ schemaVersion: 1, providers: [{ ...provider(), status: 'verified', evidence: [{}] }] }).length));
test('rejects structurally invalid registry', () => assert.ok(validateRegistry(null).length));
test('rejects links that escape a distributable skill', () => assert.ok(validateRelativeLink('../../README.md', '/repo/skills/example', '/repo/skills/example').length));
test('accepts a contained reference', () => assert.deepEqual(validateRelativeLink('references/workflow.md', '/repo/skills/example', '/repo/skills/example'), []));
test('external documentation links are not treated as local files', () => assert.deepEqual(validateRelativeLink('https://agentskills.io/specification', '/repo', '/repo'), []));
test('rejects malformed URL escapes', () => assert.ok(validateRelativeLink('references/%ZZ.md', '/repo', '/repo').length));
test('exports a public GitHub repository link validator', () => assert.equal(typeof validators.validatePublicGitHubRepositories, 'function'));
test('exports a workflow local-path validator', () => assert.equal(typeof validators.validateWorkflowLocalPaths, 'function'));
test('rejects an unreviewed GitHub repository link', () => {
  const unreviewed = ['https://github.com', 'example', 'private-product'].join('/');
  assert.deepEqual(
    validators.validatePublicGitHubRepositories(`See ${unreviewed} for details.`),
    ['unreviewed GitHub repository link: example/private-product']
  );
});
test('rejects workflow commands that reference missing repository scripts', () => {
  const workflow = 'steps:\n  - run: bash -n scripts/removed.sh\n';
  assert.deepEqual(
    validators.validateWorkflowLocalPaths(workflow, new Set(['scripts/present.sh'])),
    ['workflow references missing local file: scripts/removed.sh']
  );
});
