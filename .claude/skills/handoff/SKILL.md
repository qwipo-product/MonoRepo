---
name: handoff
description: Prepare an engineering specification from approved prototype flows. Separate confirmed requirements from simulated behavior.
---

# Prepare an engineering handoff

Use the [repository instructions](../../../CLAUDE.md).
A handoff request authorizes preparation of the specification.
Without the user's instruction to send a message, do not send it to another person.

## Establish the evidence

1. Find the approved flows and available approval evidence.
2. Read the related stories, application README, navigation, and fixtures.
3. Find simulated outcomes and missing states.
4. Find any available API documentation.
5. Ask only for decisions that the available evidence cannot resolve.

A working screen is not proof of approval.
Do not record fixture fields as a confirmed production API.
Without authorization for a product change, keep existing business rules.

## Write the specification

If a repository document is applicable, use `docs/handoffs/<app>-<flow>.md`.
Include these sections:

| Section | Content |
| --- | --- |
| Scope | Approved flows, exclusions, owner, and source references |
| Screens | User actions, displayed information, and navigation |
| States | Normal, empty, loading, error, and exceptional behavior |
| Simulated behavior | Hard-coded results, timers, fixtures, and missing integrations |
| Data requirements | Proposed entities and fields for engineering review |
| Confirmed contracts | Verified API references and versions, when available |
| Open decisions | Authorization, validation, errors, timing, and ownership gaps |
| Acceptance criteria | Observable results for each required flow |

Identify unverified API details as proposals.
Record the source and date for confirmed contracts.
Use product terms. Include the necessary integration boundaries.
Do not invent endpoints, payload fields, or service-level commitments.

Examine each requirement against its evidence before delivery.
Record the document location and the owner of each unresolved decision.
Until the engineering team no longer uses demonstration links, keep them.
