# Codex CLI tool discovery — 2026-09-19

Result: **PASS for host discovery only; existing-Card debugging NOT_RUN**.

| Field | Observed value |
| --- | --- |
| Host | Codex CLI 0.154.0-alpha.6.1 |
| OS / execution | Linux x64, kernel 6.8.0-139-generic, local |
| Runtime | Installed Linux DEB StatePort 1.0.0-beta.16 |
| Configuration | Exact production JSON from installed `stateport mcp config` |
| Host profile | `--ignore-user-config --ephemeral`; single StatePort MCP override |
| Integration | No plugin/skill loaded for this discovery-only task; alpha.8 source/package verification is separate |
| Invocation | Explicit request to inspect the host's available tool registry |
| Model | Not reported in the captured CLI event stream |

The actual host reported `mcp__stateport__inspect_state` and
`mcp__stateport__open_state` in its discovered tool registry. It made zero
StatePort tool calls: no library enumeration, Card inspection, Capture, Open,
permission/configuration changes or trial activation. The CLI exited successfully
and explicitly reported that case verification had not been performed.

This probe used an isolated configuration/session, not a fresh plugin-install
profile. It did not run the copied setup task, test alpha.8 installation, or
establish implicit activation. No Card/revision/run evidence exists for this
probe. No private source checkout was supplied to the agent. Existing user
configuration was not edited.

Separately, a local Linux Desktop package candidate with a fresh temporary
profile passed empty welcome → Settings guide → production setup preview/copy,
then ordinary synthetic Desktop Capture → Review → Save → exact task copy →
return to Card. Agent Capture remained off. The profile retained Free Capture;
Developer Open needs explicit activation. This is packaged-candidate UI proof,
not installed-release or host fix-loop acceptance. No Open/code-change/reopen
comparison was performed.

The earlier installed-runtime display failure is not reproduced by this beta.16
host discovery probe. It does not establish that agent-controlled Capture or
other older workflow blockers have been fixed. Provider workflow status remains
**unverified**. Complete fresh-host setup, restart, exact-Card current-code
baseline, real code fix and same-Card comparison remain external acceptance gates.
