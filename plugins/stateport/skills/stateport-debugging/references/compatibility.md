# Runtime compatibility decisions

Use public MCP discovery and input schemas for the connected local StatePort
server. The local `integration.json` describes this integration release and the
MCP contract range it understands. It is **not** a claim that the runtime
currently advertises a contract number or a Desktop minimum version.

1. If the server is unreachable, report that StatePort Desktop/runtime is
   unavailable; check the user's host MCP connection without changing it.
2. If a required public operation is absent from complete discovery, report
   **Required StatePort capability unavailable** and name that operation.
   Do not call a guessed replacement. If discovery itself is incomplete, say
   the capability is unknown and stop that action.
3. If the runtime advertises a public `mcpContractVersion`, compare it with
   the local `mcpContract.minimum` and `maximum`. Below minimum means
   **StatePort Desktop/runtime update required**. Above maximum means
   **StatePort integration update required**. Use the host's documented
   update path, or tell manual-copy users to replace their copy.
   A present but malformed contract number means **MCP contract unsupported**;
   stop the affected action and report the malformed public projection safely.
4. If no contract version is advertised, use discovered capabilities and
   schemas for bounded actions. Say that version compatibility is unverified;
   never fabricate a handshake or treat Desktop SemVer as a capability test.

A newer Desktop with the same public contract and required operations needs no
integration update. An older Desktop with the required public operations may
still work. Treat an unknown or malformed response as a safe blocker with the
observed operation and schema, not as proof of a particular version mismatch.
Do not download, execute, or self-update integration code.

These no-install/no-config-bypass rules govern ordinary debugging. A separately
requested installation follows the public setup entrypoint and the exact host's
provider guide, with preview and host approvals. Missing Cards are not a setup
compatibility failure; successful discovery is independent of Open/fix evidence.
