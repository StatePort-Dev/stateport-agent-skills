# Releasing

No release is published by the repository bootstrap. The package is marked
`private` to prevent accidental npm publication; GitHub source visibility is
independent of that flag.

Before the first release:

1. Bump `integrationVersion` in `integration.json` for any distributable source
   change. Keep the same release version for the current portable and native
   sources; native independent versions require a documented, centrally owned
   mapping and separate release evidence. Run `npm run sync`, `npm run check`,
   and `npm run verify`; review the complete public diff for sensitive data.
2. Validate the actual provider manifests against current official formats.
3. Run installation/update/uninstall and workflow cases in each claimed host.
4. Build the native artifacts where claimed. Check VSIX contents and install
   in separate VS Code/Cursor profiles. Run JetBrains ZIP build, binary
   verification and live IDE actions where claimed. Record the exact source
   SHA and artifact SHA-256. Package/install proof is not workflow proof.
5. Record host/runtime/skill versions and safe evidence in the compatibility
   registry. Record an old-to-new update separately before marking the update
   evidence verified. Keep incomplete surfaces unverified or blocked.
6. Verify the distributed skill includes all referenced files and no private
   sources, generated secrets or real Cards. Generate any provider copies from
   the canonical source and check freshness.
7. Update the changelog by behavior, packaging/providers, native extensions,
   compatibility, and breaking changes where applicable. Explicitly note MCP
   contract changes, manual action, and host update behavior changes. Tag the
   reviewed commit as `v<integrationVersion>`; do not reuse
   a release version with different bytes.
8. Create a GitHub Release from that exact tag as the canonical source release,
   attaching only tested artifacts with checksums and installation/removal
   instructions. Marketplace submission and approval are separate statuses;
   do not describe a source release as a Marketplace release.

CI has read-only permissions and no release tokens. Do not add automatic
marketplace uploads, npm publishing, or runtime installers to ordinary PR checks.

The VS Code source candidate under `extensions/vscode/` can be packaged with
the official pinned `@vscode/vsce@3.9.2` into a local VSIX after
`npm run sync` and `npm run verify`. Record the exact
source SHA and artifact SHA-256, inspect the archive contents, then test
install/remove in separate VS Code and Cursor profiles. A sideloaded VSIX is
not a Marketplace publication or agent/runtime acceptance. Confirm the real
publisher ID and registration before any submission; the current manifest ID
is provisional.

The JetBrains source candidate under `extensions/jetbrains/` builds a local
ZIP with JDK 25, Gradle 9.4.1, and the pinned IntelliJ Platform Gradle plugin:
`gradle clean build buildPlugin verifyPlugin`. Keep the ZIP outside Git, record
its SHA-256 and source commit, and distinguish binary verifier results from
installation and action checks in IntelliJ IDEA and WebStorm. Marketplace
publisher ownership, submission, and approval remain separate gates.
