---
name: brief
description: Clarify a product request when missing information can change the result. Record the agreed scope.
---

# Define the request

Use the [repository instructions](../../../CLAUDE.md).
Read the request and available source material before questions.
For a clear, limited change, continue without a separate approval step.

## Resolve missing information

Ask only questions that can change the result.
Combine related questions in one request.
Continue independent work while an answer is pending.
Do not use silence as authorization.

| Topic | Information to establish |
| --- | --- |
| Audience | Find who will examine the demonstration. |
| User | Find the application user and device. |
| Flows | Find the tasks that the prototype must demonstrate. |
| States | Find necessary normal, empty, loading, error, and unusual states. |
| Location | Select an existing application or an explicitly requested new application. |
| References | Find the supplied designs, requirements, and source files. |
| Data | Find existing fixtures and necessary additions. |
| Sharing | Establish if a local or hosted demonstration is necessary. |
| Completion | Define observable acceptance criteria. |

For an important unresolved choice, tell the user the alternatives and their effect.
Do not ask for information that the repository already supplies.
Do not contact a third party without authorization.

## Record the scope

For a new application or substantial import, use `docs/briefs/<app>.md`.
For a small change, a concise statement in the conversation is sufficient.
Include the user, flows, states, sources, acceptance criteria, and exclusions.
Identify assumptions and unresolved decisions clearly.

If the request already defines the scope, do not ask for another approval of the same scope.
If a missing decision blocks implementation, wait for that decision.

Use [new-mockup](../new-mockup/SKILL.md), [import-mockup](../import-mockup/SKILL.md), or [build-screen](../build-screen/SKILL.md) as applicable.
A prototype uses simulated data. Record any production integration as additional scope.
