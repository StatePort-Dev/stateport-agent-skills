# Workflow boundaries

A supplied Card selects reuse; it does not prevent this skill from applying.
Keep exact Card/revision identity and intended project/target together. A stale,
missing or ambiguous artifact requires explicit recovery or selection.

Existing-card consumption and new-card creation are independent capabilities.
An installation may support public inspect/open/compare but lack public Capture.
Do not disable a supported existing-card workflow merely because Capture or an
integration update is unavailable. Do not claim support until it has been tested.

Use tool discovery and the schemas actually advertised by the local MCP server.
This draft intentionally specifies no executable name, transport endpoint, path,
or fixed tool name. The provider integration must bind these to a verified
public runtime contract before release.

Capture lifecycle completion is a runtime property. Whether the reported symptom
was faithfully observed is a separate judgment supported by visible evidence.
Runtime validation does not certify that judgment, and a Card need not represent
a bug at all. Do not introduce a fabricated bug-confirmed flag for ordinary Save.

A saved-source build is not the current frontend. Check the selected execution
target before presenting results as verification of a code change.

Browser interaction may itself have side effects in the target application.
Permission to record does not authorize a purchase, deletion, credential change,
external message, or unrelated navigation. Apply user and host approval rules.
