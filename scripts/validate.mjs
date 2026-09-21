import path from 'node:path';

const reviewedPublicGitHubRepositories = new Set([
  'paddlehq/paddle-agent-skills',
  'stateport-dev/stateport-agent-skills'
]);

export function validatePublicGitHubRepositories(text) {
  const errors = new Set();
  const repositoryPattern = /https:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?)\/([A-Za-z0-9](?:[A-Za-z0-9_.-]*[A-Za-z0-9])?)/gi;
  for (const match of text.matchAll(repositoryPattern)) {
    const repository = `${match[1]}/${match[2].replace(/\.git$/i, '')}`.toLowerCase();
    if (!reviewedPublicGitHubRepositories.has(repository)) {
      errors.add(`unreviewed GitHub repository link: ${repository}`);
    }
  }
  return [...errors];
}

export function validateWorkflowLocalPaths(text, repositoryFiles) {
  const errors = new Set();
  for (const match of text.matchAll(/\bscripts\/[A-Za-z0-9._/-]*[A-Za-z0-9_-]/g)) {
    if (!repositoryFiles.has(match[0])) {
      errors.add(`workflow references missing local file: ${match[0]}`);
    }
  }
  return [...errors];
}

/** Validate the intentionally small, single-line scalar frontmatter used here.
 * This is not a general YAML parser or the official Agent Skills validator.
 */
export function validateSkill(text, directoryName) {
  const errors = [];
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!match) return ['Missing or malformed YAML frontmatter'];
  const fields = new Map();
  const supported = new Set(['name', 'description', 'license', 'compatibility']);
  for (const line of match[1].split(/\r?\n/)) {
    const entry = /^([a-z-]+):[ \t]*(.*)$/.exec(line);
    if (!entry || !supported.has(entry[1])) {
      errors.push('Unsupported frontmatter syntax; use documented single-line scalar fields');
      continue;
    }
    if (fields.has(entry[1])) errors.push(`Duplicate frontmatter field: ${entry[1]}`);
    fields.set(entry[1], entry[2].trim());
  }
  const name = fields.get('name') ?? '';
  if (name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) errors.push('Invalid skill name');
  if (name !== directoryName) errors.push('Skill name must match its directory');
  const description = fields.get('description') ?? '';
  if (!description || description.length > 1024) errors.push('Description must contain 1–1024 characters');
  if ((fields.get('compatibility') ?? '').length > 500) errors.push('Compatibility exceeds 500 characters');
  if (!match[2].trim()) errors.push('Skill body must not be empty');
  if (text.split(/\r?\n/).length > 500) errors.push('Move long skill content into portable references');
  return errors;
}

/** Enforce that support labels carry version-bound evidence metadata. */
export function validateRegistry(registry) {
  if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.providers)) {
    return ['Registry must use schemaVersion 1 and a providers array'];
  }
  const errors = [];
  const ids = new Set();
  const statuses = new Set(['scaffold', 'unverified', 'verified', 'blocked']);
  const updateMethods = new Set(['native-auto', 'native-manual', 'manual-copy', 'source-install', 'unverified']);
  const automaticStatuses = new Set(['yes', 'no', 'conditional', 'unverified']);
  for (const row of registry.providers) {
    if (!row || typeof row !== 'object') { errors.push('Invalid provider row'); continue; }
    if (typeof row.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)) errors.push('Invalid provider identity');
    if (ids.has(row.id)) errors.push(`Duplicate provider identity: ${row.id}`);
    ids.add(row.id);
    if (!statuses.has(row.status)) errors.push(`Unknown status for ${row.id}`);
    if (!row.update || !updateMethods.has(row.update.method) ||
        !automaticStatuses.has(row.update.automatic) ||
        !['verified', 'unverified'].includes(row.update.evidenceStatus)) {
      errors.push(`Invalid update classification for ${row.id}`);
    } else if (row.update.automatic === 'yes' && row.update.evidenceStatus !== 'verified') {
      errors.push(`Automatic update claim for ${row.id} needs host evidence`);
    }
    if (typeof row.guide !== 'string' || !row.guide) errors.push(`Missing guide for ${row.id}`);
    if (!Array.isArray(row.evidence)) { errors.push(`Invalid evidence list for ${row.id}`); continue; }
    if (row.status === 'verified' && row.evidence.length === 0) errors.push(`Verified provider ${row.id} needs evidence`);
    for (const item of row.evidence) {
      const fields = ['hostVersion', 'runtimeVersion', 'skillVersion', 'date', 'report'];
      if (!item || fields.some(key => typeof item[key] !== 'string' || !item[key].trim())) {
        errors.push(`Incomplete version-bound evidence for ${row.id}`);
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !item.report.endsWith('.md')) {
        errors.push(`Invalid evidence date or report path for ${row.id}`);
      }
    }
  }
  return errors;
}

/** Check containment, independently of whether the target exists. */
export function validateRelativeLink(href, baseDirectory, boundary) {
  if (/^https?:\/\//i.test(href) || href.startsWith('#')) return [];
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return ['Unsupported link scheme'];
  let decoded;
  try { decoded = decodeURIComponent(href.split('#')[0].split('?')[0]); }
  catch { return ['Malformed encoded link']; }
  if (!decoded || path.isAbsolute(decoded)) return ['Expected a relative file link'];
  const target = path.resolve(baseDirectory, decoded);
  const relative = path.relative(path.resolve(boundary), target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return ['Link escapes its portable boundary'];
  }
  return [];
}
