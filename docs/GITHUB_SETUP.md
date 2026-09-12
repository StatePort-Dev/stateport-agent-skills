# GitHub bootstrap and administrative settings

Intended target: **StatePort-Dev/stateport-agent-skills**, public, default branch
`main`. This file describes desired setup, not proof that remote settings have
been applied. The source archive alone does not create a GitHub repository.

## Optional maintainer bootstrap

Review the source before making it public. On a machine with Git, authenticated
GitHub CLI, Node.js 22+, npm, and a configured Git author:

```sh
bash scripts/bootstrap-github.sh --plan
bash scripts/bootstrap-github.sh --create
```

The script requires authority to create a repository in StatePort-Dev and to
configure that new repository. Publishing workflows also requires suitable
GitHub credentials. It never requests a token in chat and never changes
organization-wide permissions. It rejects existing remotes and does not force
push or reuse an existing remote repository. Run from a fresh unpacked copy.

If a step fails after creation, the repository may already exist with partially
applied settings. Do not rerun creation under a different account or delete the
repository. Inspect the error and finish the remaining settings explicitly.
The script cannot establish real-agent compatibility or successful remote CI.

## Settings applied by the optional script

| Setting | Initial value |
| --- | --- |
| Visibility | Public, only for the newly created source repository |
| Default branch | main |
| Issues | Enabled |
| Wiki / Projects | Disabled |
| Merge strategy | Squash only |
| Delete merged branches | Enabled |
| Workflow token | Read-only; cannot approve PR reviews |
| main protection | No force pushes or deletion; linear history |
| Required second reviewer | None; solo maintainer remains unblocked |

CODEOWNERS routes review to @redvoron; confirm that account has the intended
organization repository access. No unknown team is invented or granted access.

## Complete and verify remotely

- Verify the pushed commit and first `repository-checks` workflow result.
- After a real successful run, make that exact check required on `main` using a
  ruleset/branch rule that fits the organization. Do not guess a context name.
- Enable private vulnerability reporting and verify the Security-tab report path.
- Enable available secret-scanning and push-protection controls; confirm their
  actual state rather than inferring it from public visibility.
- Add topics: `stateport`, `agent-skills`, `mcp`, `developer-tools`, `debugging`.
- Verify read-only workflow permissions and no privileged PR execution.
- Configure the GitHub app's access to this organization/repository if connector
  access is needed. Access to a personal account is not organization installation.
- Do not create a marketplace listing, release tag, or npm publication until the
  gates in [RELEASING.md](RELEASING.md) are met.

The initial CI uses pinned action commits. Dependabot proposes reviewed updates;
no automatic dependency or permission escalation is enabled.
