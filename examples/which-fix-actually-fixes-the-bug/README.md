# Which fix actually fixes the bug?

**Status: illustrative challenge specification; unimplemented and unvalidated.**
This document describes a synthetic bug and two proposed patches. It does not
report an actual AI failure, an executed demo, or a verified solution. The
solution below is a design explanation to implement and test, not test evidence.

The challenge is to distinguish a screen that looks clean after losing the
failing state from a fix that handles the original failure correctly. Build a
small public reproduction, implement both candidate patches independently, and
show which one satisfies the acceptance criteria under identical conditions.

## Scope and deliverables

Use a minimal browser permissions form and a local HTTP fixture server. Plain
HTML and JavaScript plus a dependency-free Node.js server are sufficient;
another freely available stack is acceptable. No StatePort installation,
proprietary dependency, account, payment, private repository, or external API
is needed to solve this challenge. All values below are invented.

Aim for a few hours of work. Deliver a public solution repository containing:

1. The deliberately buggy baseline and independently selectable Patch A and
   Patch B implementations, with documented commands and prerequisites.
2. A deterministic fixture reset and browser reproduction steps.
3. Automated checks for the original failure and a separate valid-save case.
4. A result table for baseline, A and B, with actual request/response and UI
   observations, tested commit IDs, and any tests that were blocked or not run.

The text solution is intentionally included. This is an implementation and
verification exercise, not a claim that AI cannot solve the problem or a
hidden-answer puzzle. Any coding agent or a human can attempt it.

## Fixed fixture and HTTP contract

The form has three editable controls: Role, Export enabled, and Retention days.
Role is a synthetic configuration value, not an authentication mechanism.
The fixture server initially stores:

```json
{"role":"Reviewer","exportEnabled":false,"retentionDays":7}
```

`GET /api/permissions` returns HTTP 200 with that stored configuration.
The initial clean form therefore shows Reviewer / export disabled / 7 days.

For the failing case, edit the form to this exact unsaved draft:

```json
{"role":"Manager","exportEnabled":true,"retentionDays":0}
```

The client must allow submitting this draft so the server-validation path can
be exercised. Zero is a representable input, not an absent value. Do not add a
client guard that prevents this particular request from reaching the server.

On Save, issue exactly one `POST /api/permissions` with
`Content-Type: application/json` and this exact body:

```json
{"role":"Manager","exportEnabled":true,"retentionDays":0}
```

The fixture requires an integer retention period of at least 1 day. It rejects
the request, leaves the stored configuration unchanged, and returns HTTP 422
with `Content-Type: application/json` and this exact body:

```json
{
  "error": "validation_failed",
  "fieldErrors": {
    "retentionDays": {
      "code": "minimum",
      "message": "Retention days must be at least 1.",
      "minimum": 1,
      "received": 0
    }
  }
}
```

HTTP 422 is a valid validation response, not a successful save and not a
transport failure. The nested field error is an object; its `message` property
is displayable text. Reset the stored configuration and the draft to the
specified starting conditions before every independent attempt.

## Deliberately buggy baseline

The baseline sends the required POST, receives the required 422, then attempts
to render the entire `fieldErrors.retentionDays` object as a text child. In a
renderer that rejects object children, this throws and replaces the form with
an error boundary or a blank/crashed screen. If using plain DOM APIs, implement
an explicit text renderer that rejects non-string values so the baseline has
the same documented failure. Do not rely on accidental object coercion.

To reproduce:

1. Reset the fixture and load the initial form.
2. Select Manager, enable Export, and enter 0 retention days.
3. Save once; inspect the POST body and HTTP 422 response.
4. Observe the validation-rendering crash instead of an editable form and a
   field error. Record this observation before evaluating either patch.

The intended behavior is to keep the unsaved Manager / enabled / 0 draft
visible and editable, show the retention error, and avoid reporting success.

## The two candidate patches

### Patch A: clear the draft and reload defaults

Patch A reacts to the rejected save by discarding the draft and fetching the
stored configuration again. The form returns to Reviewer / disabled / 7 and
looks clean. Its proposed check reloads the initial screen and asserts that
the form is visible without a crash.

That check examines a different state. Patch A can hide the rendering failure
by removing the error and unsaved inputs. It fails this challenge because the
user's draft is lost and the required field error is absent, even if the final
screen looks healthy. Evaluate A with the original criteria below as well.

### Patch B: preserve the draft and handle HTTP 422

Patch B separates the editable draft, the saved configuration, field errors,
and save status. It treats 422 as a rejected save, extracts the message string,
and renders it next to Retention days. It keeps the form mounted and leaves
all draft values intact. It displays no successful-save state.

## Standalone text solution: Patch B

The fix belongs in response handling and error rendering. Changing retention
to 1, changing the selected role, or disabling export would change the test
case instead of handling its validation failure.

Keep independent values for `draft`, `savedConfiguration`, `fieldErrors`, and
`saveStatus`. On submit, copy the current draft into the request body, clear
stale feedback, and mark the operation as saving. Do not clear the draft.

For the fixed HTTP 422 response:

1. Read the JSON response without treating a resolved fetch as HTTP success.
2. Set the retention error to the string
   `body.fieldErrors.retentionDays.message`.
3. Set save status to rejected, release the saving state, and allow editing
   and another save attempt.
4. Leave `draft` and `savedConfiguration` unchanged. Do not reload defaults,
   navigate away, reset controls, or show a success toast.

Render only the message string, associated with the Retention days control
(for example, `aria-describedby` and `aria-invalid="true"`). Render text safely;
do not inject server messages as HTML. A malformed or missing message can use
a generic rejection message, but the specified fixture must display the exact
retention message. A separate network or unexpected-status path should also
retain the draft and avoid reporting success.

For HTTP 200 only, update saved configuration from the successful response,
clear the old field error, mark save status as saved, and report success.
Use explicit integer parsing that preserves zero when reading the input;
do not use a truthiness fallback such as `value || 7`.

This response-handling outline is sufficient to implement B with any chosen
UI stack. The actual implementation still needs the browser checks below.

## Acceptance criteria fixed before attempts

For baseline, A and B, reset independently and repeat the same interactions
with the same draft, role, endpoint, POST body, status and response JSON.
Assertions must observe the browser after the rejected save; a handler unit
test alone does not establish the rendered outcome.

| Criterion for the original failing case | Required observation |
| --- | --- |
| Exercise the same failure | Exactly one POST sends Manager / enabled / 0 and receives the specified HTTP 422 and JSON |
| No crash | Form stays mounted; no error boundary, blank screen, uncaught rendering exception, or unhandled rejection |
| Draft retained | Role remains Manager, Export remains enabled, Retention remains 0; controls remain editable |
| Field error shown | Visible text next to Retention: `Retention days must be at least 1.`; associated with that control |
| No false success | No saved/success message, success toast, success navigation, or successful-save state |
| Server unchanged | Stored configuration remains Reviewer / disabled / 7 |
| Retry possible | Save is no longer stuck pending and the user can correct the draft |

Do not change inputs, roles, the failing request, fixture, response, server
minimum, or acceptance assertions to make a patch pass. Do not replace zero
with a default, swallow all feedback, skip Save, or substitute a screenshot
of the initial clean screen. A reload of the clean initial state is not
evidence that the original failing case passed.

The predicted outcomes are baseline failing the no-crash requirement, A
failing draft/error requirements, and B satisfying all original-case criteria.
These are predictions from the specification, not measured results. Publish
actual results, including disagreements or implementation mistakes.

### Separate valid-save regression

After checking the failing case, change only Retention from 0 to 1 in the
retained Manager / enabled draft. This is a new, explicitly separate case.
Save once with:

```json
{"role":"Manager","exportEnabled":true,"retentionDays":1}
```

The server now stores the new configuration and returns HTTP 200 with that
same JSON. Verify the form remains Manager / enabled / 1, the previous field
error disappears, saving finishes, and success is shown. A subsequent GET
must return Manager / enabled / 1. Report this result separately; it cannot
replace verification of the rejected-save case.

No special performance benchmark is required. Tests may use a documented
finite timeout to detect crashes or stuck saving; report the timeout and
avoid arbitrary sleeps as proof of completion.

## Optional proposed StatePort demonstration

Roman Novikov (`redvoron`) is the founder of [StatePort](https://stateport.dev).
That affiliation is disclosed because this specification is hosted in a
StatePort public repository. The challenge and the text solution above are
usable independently of the product.

An optional future demonstration could capture the synthetic failing draft,
try A and B in independent runs, and compare the same declared case against
the criteria above. **No such demonstration has been executed or validated
for this challenge.** Its feasibility depends on the available runtime and
supported capture/replay capabilities. Any run must separately verify the
request, response and visible UI; a saved Card alone is not proof of a fix.
This proposal makes no claim about token savings, complete browser snapshot
coverage, guaranteed replay equivalence, or AI performance.

## Questions and reuse

Ask clarification questions in the submission PR or a
[public repository issue](https://github.com/StatePort-Dev/stateport-agent-skills/issues/new).
Include only synthetic examples. Keep the fixed failing-case contract intact
when clarifying implementation choices.

MIT licensed; see the [repository license](../../LICENSE).
