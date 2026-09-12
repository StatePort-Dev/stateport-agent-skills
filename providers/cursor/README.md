# Cursor integration preparation

Cursor Agent Plugin status: **scaffold; no native plugin load or agent workflow
verified**. A separate [VSIX source candidate](../../extensions/vscode/README.md)
installed and uninstalled in Cursor `3.7.27`, but its skill, MCP and agent
behavior have not been host-tested.

The canonical source is
[StatePort debugging](../../skills/stateport-debugging/SKILL.md).
No separate strategy or manually copied skill belongs here.

Before adding packaging, verify the current official host documentation and
record the exact source URL, host version, supported surface, skill/plugin
format, MCP transport, install scope, and discovery mechanism.
Do not guess paths or commands from another agent's conventions.

Implement the smallest native package or standalone-skill adapter the actual
host supports. Preserve existing user settings. Test fresh install, duplicate
installation, disabled integration, update, rollback, and removal. The adapter
must use the public runtime contract, not a private source checkout.

Record existing-card and create-card capabilities separately. A missing runtime
or unsupported Capture API must produce a useful bounded error, not installation
of unknown binaries, hidden network access, or an alternative browser.

Run the relevant synthetic cases from
[the evaluation guide](../../tests/evaluations/README.md) in a real host. Record
all attempts including failures, actual versions, invocation mode, and safe
results. Update [the registry](../registry.json) only when the evidence supports
its status. Do not advertise automatic invocation from one successful demo.
