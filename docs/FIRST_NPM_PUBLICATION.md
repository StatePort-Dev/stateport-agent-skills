# First npm publication with provenance

Prepare the exact transparent bootstrap archive and keyless provenance in the
manual `Prepare first-publish provenance` workflow. It checks the public source
commit, package version and archive SHA-256, verifies its Sigstore bundle and
performs no npm registry write. Download and verify the exact tarball and bundle
before publication.

The bootstrap's `publishConfig` specifies public access and the npm registry.
It does not choose a provenance mode. Select exactly one at publication time:

- First publication by an authenticated maintainer: npm 12.2.1 with the verified
  `--provenance-file=/absolute/path/to/stateport-VERSION.tgz.sigstore`.
- Subsequent reviewed trusted-publisher CI: the existing `publish-agent.yml`
  uses OIDC and explicit `--provenance`.

Do not combine `--provenance` (including a false flag) with `--provenance-file`,
move the file option into an environment variable to evade validation, omit
provenance, or change a tarball after its attestation. Use the normal npm login
and 2FA flow; never send login credentials to CI or chat. The first exact
archive/Sigstore transport must pass the real CLI loopback test before a registry
write. A mock registry pass is separate from actual npm publication.

Run the maintainer CLI from the reviewed, clean **public source checkout**.
Legacy registry gitHead and local-file resolution metadata can reflect the caller's
working directory; they do not replace the verified provenance source. Never use
a private application checkout as the publisher's working directory.

Publish the real target archive directly with `--access public --tag latest --ignore-scripts`, after any recorded registry cooldown. Confirm the registry
integrity, attached provenance, exact latest tag and a fresh named installation.
Configure or verify the exact trusted publisher after the real package exists.

Do not stage the target version to bootstrap the registry. Staging a new package
creates a placeholder; rejecting its sole staged version can delete that
placeholder and trigger npm's 24-hour republishing restriction. Do not reject the
last stage to make room for an automated first publish. This workflow schedules
no delayed registry write.

References: [npm publish](https://docs.npmjs.com/cli/v12/commands/npm-publish/),
[provenance](https://docs.npmjs.com/generating-provenance-statements/),
[staged publishing](https://docs.npmjs.com/staged-publishing/),
[unpublish policy](https://docs.npmjs.com/policies/unpublish/).
