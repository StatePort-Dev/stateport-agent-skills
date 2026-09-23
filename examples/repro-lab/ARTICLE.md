# A one-line JavaScript bug that needs a three-part reproduction

A quota screen says 100 credits are available. The API response says zero.
The fix is one operator, but a useful bug report needs more than the page URL.
It needs the role, the entered amount, and the response that drove the decision.

Here is a small runnable exercise with no dependencies or external services.
It uses synthetic data and a pretend allocation button. You can debug it with
browser DevTools, write a regression test, or hand the same case to a coding agent.

## Start with the state, not the screenshot

Clone the [exercise repository](https://github.com/StatePort-Dev/stateport-agent-skills)
with Node.js 22 or newer installed:

```sh
git clone https://github.com/StatePort-Dev/stateport-agent-skills.git
cd stateport-agent-skills/examples/repro-lab
npm start
```

Open `http://127.0.0.1:4173`. The initial Member role cannot allocate credits,
so it masks the faulty decision. Switch to Reviewer, choose Exhausted quota,
and enter 10. Now the button is enabled even though the API reports:

```json
{ "remaining": 0, "defaultLimit": 100 }
```

The screen prints the response beside the decision. Its role is only a UI fixture,
not an authentication system, and the allocation button changes no server data.

| Role | API remaining | Requested | Expected |
| --- | ---: | ---: | --- |
| Member | 100 | 10 | Role blocks allocation |
| Reviewer | 100 | 10 | Allocation enabled |
| Reviewer | 0 | 10 | Allocation blocked |
| Reviewer | null | 10 | Default of 100 permits allocation |

Testing only the first two rows misses the bug. Testing only the third row after
a fix can miss a broken fallback. The fourth row defines what missing means in
this example's contract.

## Separate zero from missing

The faulty line in `public/decision.mjs` is:

```js
const available = quota.remaining || quota.defaultLimit;
```

Logical OR selects the fallback for a falsy left operand, including zero.
For this contract, the fallback belongs only to a null or undefined value:

```js
const available = quota.remaining ?? quota.defaultLimit;
```

That distinction follows the language's
[short-circuit expression semantics](https://262.ecma-international.org/15.0/index.html#sec-binary-logical-operators).
It does not replace validation: a real API still needs a contract for negative
numbers, strings and unexpected payloads. This fixture intentionally restricts
responses to three known cases.

## Make the symptom executable

In a second terminal, from the exercise directory, run `npm test`. It deliberately
fails before the change, with `100 !== 0`. The regression checks both the displayed
value's source and the allocation decision:

```js
const result = decision('reviewer', 10, { remaining: 0, defaultLimit: 100 });
assert.equal(result.available, 0);
assert.equal(result.allowed, false);
```

Change the operator and run the test again. Then reload the page with the same
Reviewer / Exhausted / 10 setup. The controls persist in localStorage, so the
same browser can retain them across reloads. A new browser profile starts with
defaults; the URL alone does not carry these values.

Check the button as well as the number. A passing function test does not prove
that the page loaded the corrected module or wired the result to the control.
Finally, check Normal and Missing quota to protect the behavior around the fix.

## Hand over a reproducible task

A useful handoff names the local origin, role, input, API fixture, observed
decision and expected decision. For this exercise:

> At http://127.0.0.1:4173 choose Reviewer, Exhausted quota and 10 credits.
> The API returns remaining 0 and defaultLimit 100. The UI shows 100 and enables
> allocation. It should show 0 and disable allocation. Keep that response and
> those inputs unchanged when comparing the original code and the fix.

This keeps the comparison meaningful. Switching the fixture to a positive quota,
changing the role, or reopening a fresh profile can change the visible result
without fixing the reported defect.

The [exercise README](README.md) includes reset instructions and an optional
saved-reproduction workflow. Everything needed for the manual exercise and
regression is public; no private application data is needed.

*Disclosure: this educational example is published by StatePort. The exercise
itself requires no StatePort installation or account.*
