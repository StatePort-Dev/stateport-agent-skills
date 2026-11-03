# First npm publication with provenance

A fresh package has no existing trusted-publisher binding. Prepare the exact
bootstrap archive and keyless provenance in the manual `Prepare first-publish
provenance` GitHub workflow. It uses the pinned npm builder and performs no npm
registry mutation. Verify the source commit, archive SHA-256 and Sigstore subject
from its artifact before publication.

An authenticated maintainer can publish that exact archive using npm's documented
`--provenance-file` option and complete the normal 2FA ceremony. The archived bootstrap requests automatic provenance in its publication metadata.
The exact publisher must reconcile that setting with an explicit provenance file;
current CLI option exclusivity must be checked before executing a publication.
The workflow prepares verified evidence only, not an already validated first-publish
transport. Do not omit provenance or assume a CLI upgrade resolves the metadata
interaction. No registry write or delayed retry is scheduled by this workflow.
After the real version exists, configure the exact `publish-agent.yml` trusted
publisher for subsequent CI releases. Do not send login credentials to CI.

Avoid bootstrapping the registry by staging the real target version: it blocks
direct publication of that version until approved or rejected. For a new package,
staging creates a public placeholder. Rejecting its only staged version can remove
the entire placeholder package and trigger npm's 24-hour republishing restriction.
Do not reject the last stage to make room for an automated first publish.

References: [npm provenance](https://docs.npmjs.com/generating-provenance-statements/),
[provenance-file](https://docs.npmjs.com/cli/v12/commands/npm-publish/),
[staged publishing](https://docs.npmjs.com/staged-publishing/),
[unpublish policy](https://docs.npmjs.com/policies/unpublish/).
