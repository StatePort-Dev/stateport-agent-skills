# Repository bootstrap

Scope: initialize a standalone public source repository for StatePort agent skills
and provider packaging. The runtime and native IDE extension implementations are
not copied into this repository.

1. Write failing structural validation tests.
2. Add a dependency-free validator and a canonical draft skill.
3. Add provider preparation directories, a compatibility registry, public
   contribution/security rules, issue templates, and read-only CI.
4. Run local checks and review the public boundary.
5. Create and configure the organization repository only through an authorized
   GitHub connection. Verify the published commit and actual CI separately.

The source scaffold is not a supported plugin release. Host installations,
automatic invocation, MCP integration, and GitHub administration need their own
recorded evidence. No public release or marketplace listing is created here.
