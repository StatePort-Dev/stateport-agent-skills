# Public runtime compatibility projection needed

The public StatePort MCP operation map inspected for this integration does not
advertise a stable `mcpContractVersion`, `runtimeVersion`, or explicit capability
inventory. This is a follow-up for the **StatePort MCP runtime owners**; this
public integration repository does not implement a second wire protocol or a
fake handshake. Its current consumer fallback is tool/schema discovery.

## Requested public projection

Expose one safe, discoverable metadata projection through the existing public
MCP surface, using a name and schema chosen and documented by the runtime
owners. Its bounded response should include:

```json
{
  "runtimeVersion": "<installed Desktop/runtime SemVer>",
  "mcpContractVersion": 1,
  "capabilities": ["<stable public capability identifiers>"]
}
```

`runtimeVersion` is informational. `mcpContractVersion` is an integer for the
StatePort public MCP schema, independent of Desktop and plugin SemVer. Change
it only for incompatible public contract changes; adding a backward-compatible
operation can leave it unchanged. `capabilities` must reflect operations
actually available and authorized in this local runtime/session. Stable IDs
should map to documented public operations or feature groups, not private
implementation classes. A listed capability does not grant permission to act:
the existing operation schema, approvals and runtime policy still apply.

The projection must reveal no Card identifiers, Card metadata, captured
payloads, paths, secrets, auth bindings, browser profile details, customer data,
or private environment state. It must not trigger Capture, start a browser,
change configuration, or contact an update service. Use only the existing MCP
transport and public discovery conventions; do not add a plugin-specific
network protocol.

## Backward compatibility and consumer behavior

Existing runtimes without the projection must keep their current public tools
working. Consumers discover tools and schemas first. If the projection is
missing, they report contract version unknown and use only confirmed operations.
An unavailable required operation yields **Required StatePort capability
unavailable**. For a known contract lower than the integration's minimum, say
**StatePort Desktop/runtime update required**; above its maximum, say
**StatePort integration update required**. Do not infer a version mismatch from
an arbitrary tool error or parse failure. An explicitly malformed contract
number is **MCP contract unsupported** and needs runtime-side diagnosis.
With matching contract and required
capabilities, a newer or older Desktop SemVer alone does not force an update.

## Runtime-side acceptance tests

- A real public MCP client can discover and read the projection on a locally
  installed runtime; no private API or test-only endpoint is needed.
- The projection schema is stable and documented, with a contract integer,
  informational runtime version and capability IDs matching public discovery.
- A missing or unauthorized capability is not advertised as usable; the normal
  operation still enforces its permission checks.
- Additive runtime changes keep the contract version and existing consumer
  operations working. An incompatible change increments the contract version.
- Old clients that never request the projection continue to work. New clients
  can distinguish absent projection, too-old and too-new contracts.
- Security tests confirm the projection contains no sensitive identifiers,
  Card contents, paths, credentials or captured payloads.

Until those runtime tests and a real host handshake exist, this document is a
dependency specification, not evidence that the projection ships.
