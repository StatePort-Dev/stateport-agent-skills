#!/usr/bin/env bash
# Optional maintainer operation. Nothing runs automatically during installation.
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
REPO='StatePort-Dev/stateport-agent-skills'
MODE="${1:---plan}"
if [[ $# -gt 1 || ( "$MODE" != '--plan' && "$MODE" != '--create' ) ]]; then
  printf 'Usage: bash scripts/bootstrap-github.sh [--plan|--create]\n' >&2
  exit 2
fi
cat <<'PLAN'
Target: StatePort-Dev/stateport-agent-skills (PUBLIC)
Plan: validate source; initialize a local main branch if needed; create a NEW
repository and push the reviewed source; configure issues, squash merging,
branch deletion after merge, read-only workflow permissions, and main protection.
No organization-wide settings, credentials, marketplace or runtime are changed.
Existing remote repositories are never overwritten or force-pushed.
PLAN
[[ "$MODE" == '--create' ]] || exit 0
for tool in git gh node npm; do
  command -v "$tool" >/dev/null || { printf 'Required command is missing: %s\n' "$tool" >&2; exit 1; }
done
gh auth status --hostname github.com >/dev/null 2>&1 || { echo 'Authenticate GitHub CLI locally first; do not paste tokens into chat.' >&2; exit 1; }
cd "$ROOT"
[[ "$(node -p 'Number(process.versions.node.split(".")[0]) >= 22')" == 'true' ]] || { echo 'Node.js 22 or later is required.' >&2; exit 1; }
npm run verify
if top="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  [[ "$top" == "$ROOT" ]] || { echo 'Unpack this scaffold outside another Git repository.' >&2; exit 1; }
else
  git init --initial-branch=main
fi
[[ "$(git branch --show-current)" == 'main' ]] || { echo 'Expected local main branch; no branch is changed automatically.' >&2; exit 1; }
git config user.name >/dev/null && git config user.email >/dev/null || { echo 'Configure your local Git author name and email first.' >&2; exit 1; }
[[ -z "$(git remote)" ]] || { echo 'A remote already exists. Refusing to republish or overwrite it.' >&2; exit 1; }
git add -- .
if ! git diff --cached --quiet; then
  git commit -m 'chore: initialize public StatePort agent skills scaffold'
fi
# GitHub itself rejects an existing repository, missing organization permission,
# or unavailable repository name. Do not reinterpret these errors or retry elsewhere.
gh repo create "$REPO" --public --source="$ROOT" --remote=origin --push \
  --description 'Canonical StatePort agent skills and provider integration sources; development scaffold.'
# These operations require repository administration permission on the new repo.
gh api --hostname github.com --method PATCH "repos/$REPO" \
  -f default_branch=main -F has_issues=true -F has_wiki=false -F has_projects=false \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true >/dev/null
gh api --hostname github.com --method PUT "repos/$REPO/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false >/dev/null
# Solo-friendly initial protection: no forced second reviewer or required CI
# context until the first actual workflow run has been verified.
gh api --hostname github.com --method PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
printf '\nRepository pushed and settings requests succeeded. Read-back metadata:\n'
gh repo view "$REPO" --json nameWithOwner,url,isPrivate,defaultBranchRef
printf '\nCI has NOT been verified by this script. Inspect the first repository-checks run.\n'
printf 'Then complete docs/GITHUB_SETUP.md; do not publish a release from the scaffold.\n'
