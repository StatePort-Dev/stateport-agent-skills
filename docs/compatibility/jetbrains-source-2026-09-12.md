# JetBrains plugin source check, 2026-09-12

Status: **LIMITED build and binary compatibility proof; IDE actions and
StatePort workflow NOT RUN**.

| Field | Observed value |
| --- | --- |
| Platform SDK | IntelliJ Platform Gradle Plugin `2.18.1` |
| Build tools | Gradle `9.4.1`, Temurin JDK `25.0.4.1+1`, Java 21 target bytecode |
| Artifact | Local `stateport-jetbrains-0.1.0-alpha.0.zip`, not uploaded or released |
| SHA-256 | `849eddf72c2d8e97178d01077f9cfd9bc8776b9166a23a96d7be6c3603a4251c` |
| Descriptor range | IntelliJ Platform builds `261.*`–`262.*` |
| Runtime | Installed StatePort Desktop unavailable |
| Agent/model | NOT RUN |

The plugin uses public IntelliJ Platform `AnAction`, `Messages`, and
`CopyPasteManager` APIs. It has two Tools menu actions: show the documented
AI Assistant MCP client setup path, and copy a validated exact Card/revision
handoff. The code never launches a command, reads a Card, writes IDE MCP
configuration, or registers itself as a StatePort MCP server. AI Assistant is
not a required plugin dependency.

## Local checks

- `npm test`: the JetBrains source shape check passed after the initial
  missing-source failure; it is not a host or workflow test.
- `gradle clean build buildPlugin verifyPluginConfiguration verifyPlugin`:
  Java compilation, `verifyHandoff` input rejection/format check, and ZIP
  packaging passed. `verifyPluginConfiguration` warned that the bounded
  `until-build` excludes future untested IDE versions; this range is deliberate.
- The final ZIP contains one plugin JAR with the descriptor, three plugin
  classes, and `META-INF/LICENSE` byte-matching the root license. `Handoff`
  uses Java class version `65` (Java 21).
- IntelliJ Plugin Verifier `1.410` checked the final ZIP against WebStorm
  `2026.1.3` (`WS-261.25134.101`), IntelliJ IDEA `2026.1.3`
  (`IU-261.25134.95`), WebStorm `2026.2.0.1` (`WS-262.8665.341`), and
  IntelliJ IDEA `2026.2.0.1` (`IU-262.8665.337`): all reported `Compatible`.

## Unrun acceptance

Install-from-disk, action display and interaction in WebStorm or IntelliJ
IDEA, AI Assistant availability and configuration, real StatePort MCP
handshake, exact Card inspect/open/reopen/compare, automatic agent selection,
Capture, update/remove in a live IDE, macOS/Windows, Marketplace submission,
and installed-product acceptance are **NOT RUN**. The user must review the
copied Desktop configuration and confirm the MCP client connection in the
IDE. This record cannot establish that an agent reproduced or fixed a bug.
