# Reproduction Lab: zero is not missing

A small, deliberately buggy localhost app for practicing reproducible bug reports
and agent-assisted fixes. All data is synthetic. No account, package install,
external API or StatePort installation is required to run the exercise.

## Run

Requires Node.js 22 or newer and Git. From a terminal:

```sh
git clone https://github.com/StatePort-Dev/stateport-agent-skills.git
cd stateport-agent-skills/examples/repro-lab
npm start
```

Open `http://127.0.0.1:4173`. Keep the server running. It listens on loopback only.
If port 4173 is occupied, stop the other process or change the port in `server.mjs`
and use the matching URL throughout the exercise. Stop this server with Ctrl+C.

## Reproduce

1. Choose **Reviewer**.
2. Choose **Exhausted quota · 0**.
3. Enter **10** credits.
4. Compare the API response (`remaining: 0`) with **UI says available: 100**.
   The app incorrectly enables **Simulate allocation**.

Expected: available credits stay at **0**, the decision says **Not enough
credits**, and the button is disabled.

Role, API scenario and requested amount persist under three `repro-lab.*`
localStorage keys. These roles are UI fixtures, not authentication. Allocation
only writes a message into the page; it changes no server data. **Reset this
demo** clears only these three keys and restores the starting state.

## Fix and check

From a second terminal in `examples/repro-lab`:

```sh
npm test
```

**This test is intentionally red in the exercise.** It reports `100 !== 0`.
Investigate `public/decision.mjs`, fix the handling of zero, and run it again.
Reload the same URL, keeping Reviewer / Exhausted / 10. Confirm the disabled
button and the zero value, then check Normal and Missing quota as well.

Read the [technical walkthrough](ARTICLE.md) for the explanation and solution.
The rest of this repository is checked separately by `npm run verify` at its
root; that command does not include the deliberately failing exercise test.

## Try the same case with StatePort

The [StatePort walkthrough](WITH_STATEPORT.md) includes a capture task and a
same-Card fix task. This is an optional way to try the workflow on data you can
inspect and reset yourself.

Found something unclear? Open a [public issue](https://github.com/StatePort-Dev/stateport-agent-skills/issues/new)
with the step, expected/actual result, OS and Node version. For a StatePort run,
also include the Desktop and agent versions. Share only synthetic evidence;
there is no need to upload a private Card or record your own application.

MIT licensed; see the [repository license](../../LICENSE).
