# StatePort Debugging for IntelliJ IDEA and WebStorm — source candidate

This thin IntelliJ Platform plugin adds two **Tools** menu actions. **StatePort:
Copy Exact Card Handoff** asks for a user-supplied Card ID and revision, then
copies bounded context for review and manual paste into an agent. It does not
inspect or open a Card. Card/revision values are limited to 256 characters,
letters, digits, `.`, `_`, `:`, `/`, `@`, `#`, `-`, without `..`; unsupported
opaque IDs need manual handoff. **StatePort: Connect Agent Help** shows the documented
local AI Assistant MCP setup path. It does not modify IDE settings, launch
Desktop, test a connection, or install an agent. The plugin carries no runtime,
secrets, browser profile, or captured data.

The named local agent path is [JetBrains AI Assistant as an MCP client](https://www.jetbrains.com/help/ai-assistant/mcp.html).
In installed StatePort Desktop, use **Copy MCP config** and review the absolute
command and arguments. In the IDE, open **Settings | Tools | AI Assistant |
Model Context Protocol (MCP)**, add the copied JSON as a local STDIO server,
apply it, and inspect the connection status and available tools. This is
distinct from exposing the IDE's own MCP server to external agents. The IDE's
AI Assistant and StatePort Desktop must both be available locally. A copied
JSON document or a successful plugin install is not a handshake.

The plugin's platform dependency is only `com.intellij.modules.platform`;
AI Assistant is optional. Its declared build range is `261.*`–`262.*`
(2026.1–2026.2). Binary checks use [IntelliJ Plugin Verifier](https://plugins.jetbrains.com/docs/intellij/verifying-plugin-compatibility.html)
against named IntelliJ IDEA and WebStorm builds. Those checks do not run the
actions in the IDE or an agent workflow. The current source and evidence are
recorded in [the JetBrains compatibility report](../../docs/compatibility/jetbrains-source-2026-09-12.md).

For a local build, use JDK 25 and Gradle 9.4.1 with the official IntelliJ
Platform Gradle plugin declared in `build.gradle`. From this directory run:

```sh
gradle clean build buildPlugin verifyPlugin
```

The ZIP is placed in `build/distributions/`. Review its descriptor and SHA-256
before using **Settings | Plugins | Install Plugin from Disk** in each IDE.
Use the IDE's **Installed** plugins tab to disable or uninstall it; the plugin
has no saved settings to remove and does not alter Cards, Desktop, or other MCP
servers. Sideload availability does not establish Marketplace publication.
No JetBrains Marketplace submission or publisher ownership has been claimed.
The ZIP and descriptor version is generated from root `integration.json` by
`npm run sync`. For a disk install, install a newer reviewed ZIP yourself.
JetBrains' configurable automatic plugin updates apply to available repository
updates; no StatePort Marketplace update path has been published or tested.
