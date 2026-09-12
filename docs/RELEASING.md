# Releasing

No release is published by the repository bootstrap. The package is marked
`private` to prevent accidental npm publication; GitHub source visibility is
independent of that flag.

Before the first release:

1. Run `npm run verify` and review the complete public diff for sensitive data.
2. Validate the actual provider manifests against current official formats.
3. Run installation/update/uninstall and workflow cases in each claimed host.
4. Record host/runtime/skill versions and safe evidence in the compatibility
   registry. Keep incomplete surfaces unverified or blocked.
5. Verify the distributed skill includes all referenced files and no private
   sources, generated secrets or real Cards. Generate any provider copies from
   the canonical source and check freshness.
6. Update the changelog and version, then tag the reviewed commit. Do not reuse
   a release version with different bytes.
7. Publish only tested source/packages, with checksums and installation/removal
   instructions. Marketplace submission and approval are separate statuses.

CI has read-only permissions and no release tokens. Do not add automatic
marketplace uploads, npm publishing, or runtime installers to ordinary PR checks.
