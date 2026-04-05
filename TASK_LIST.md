# SweetBook Frontend Task List

This list is ordered. Execute one task at a time using the task loop:
Planner -> Test -> Implementation -> Security -> Architecture -> Review -> Git -> PR.

## Tasks

| ID | Task | Purpose | Depends On | Output |
| --- | --- | --- | --- | --- |
| T1 | Frontend bootstrap and stack confirmation | Establish the frontend runtime, project structure, and test foundation | none | clean frontend scaffold and confirmed toolchain |
| T2 | App shell, routing, and shared UI foundation | Build the baseline navigation, layout, and reusable presentation primitives | T1 | shell routes, layout, and shared UI system |
| T3 | Group and event management screens | Implement the MVP screens for group and event creation/navigation | T2 | group/event UI and state flow |
| T4 | Photo upload and like interaction screens | Implement photo upload and like interactions with feedback states | T3 | photo/like UI and client interactions |
| T5 | Album candidate review experience | Show ranked candidates and page preview surfaces for users | T4 | candidate review UI and presentation states |
| T6 | Order flow entry and SweetBook handoff UI | Build the order flow and client-side handoff boundaries to backend integration | T5 | order UI and integration-ready handoff |
| T7 | Validation and hardening pass | Confirm responsiveness, accessibility, regressions, and delivery readiness | T6 | hardened frontend ready for merge |

## Notes

- T1 must settle the frontend stack before deeper UI work begins.
- T2 through T6 should preserve clear presentation boundaries and keep backend integration explicit.
- T7 is mandatory before any PR-ready delivery.
