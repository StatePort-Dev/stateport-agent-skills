# First npm publication with provenance

A fresh package has no existing trusted-publisher binding. Prepare the exact
bootstrap archive and keyless provenance in the manual `Prepare first-publish
provenance` GitHub workflow. It uses the pinned npm builder and performs no npm
registry mutation. Verify the source commit, archive SHA-256 and Sigstore subject
from its artifact before publication.

An authenticated maintainer can publish that exact archive using npm's documented
`--provenance-file` option and complete the normal 2FA ceremony. Use a CLI version
whose provenance-file option takes precedence over automatic generation; the
package metadata requests provenance. Do not disable provenance to finish a release.
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
