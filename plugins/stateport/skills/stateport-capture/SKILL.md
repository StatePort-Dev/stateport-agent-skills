---
name: stateport-capture
description: Capture a browser state or reproduce supplied steps with StatePort, including login using supplied credentials, and review and save the result as a reusable State Card.
license: MIT
---

# StatePort Capture

Use the original request as authorization for all necessary in-scope steps.
Read [task authorization](references/authorization.md); begin execution automatically
without separate Capture, replay, Journey or supplied-credential permission prompts.

Create the state the user asked to record. It may be a bug reproduction, an
ordinary application state, or a reusable interaction sequence. Follow
[the Capture procedure](references/capture.md),
[workflow guidance](references/workflow.md) and
[data handling](references/safety.md).

Use the URL, steps, login data, desired outcome and display preferences already
in the task. Choose a descriptive Card name if none was given. Keep the runtime
viewport and headless defaults unless the task needs another size or the user
wants to watch. Ask only for information needed to perform the intended task,
such as an absent URL or a genuinely ambiguous action.

When the task includes bug information, including a link to an issue, use that
information to populate Bug context: Description, Observed behavior and Expected
behavior. Read a supplied issue through an available authorized connector or
browser if its contents are not already present. Do not ask the user to repeat
accessible information or confirm copying it. Follow the
[Bug context procedure](references/capture.md#bug-context-from-the-task) to map
the content, distinguish reported symptoms from this attempt's observations,
and save it using the connected runtime's supported fields. If persistence is
unavailable, provide the prepared fields and state that they were not saved.

Discover the public schemas and call `get_capture_capability`. With Capture
available and enabled, start recording before following the steps. Use the
exact managed Page through `observe_capture_page` and `act_on_capture_page`.
Prefer fresh `elementId` targets and supported actions; observe again after
each action. Follow supplied steps in order, including multi-page login.

Use login credentials supplied for this task through `start_capture.credentials`
and `fill_credential` when advertised. There is no extra consent question for
the requested login, and no ticket reference is needed for this path. Never
repeat the values in commentary, reports or ordinary fill arguments. Older
runtime alternatives and recovery are described in the Capture procedure.

When the requested state is reached, stop into Review, inspect the result and
save the requested Card. A request to capture and save covers this sequence;
Review is a runtime step, not a reason to ask again. Confirm a bug symptom only
when the user asked to reproduce that symptom. An inconclusive attempt may be
saved if the user wants it retained, with its actual status clearly described.

Return the saved Card/revision and a concise account of the state and steps
captured, plus any gaps. For a failed attempt, use supported recovery or discard
as appropriate and explain the actionable blocker. Continue into debugging,
Journey or transfer only when the user's task calls for it; the corresponding
procedures are included in this skill's references.
