# SweetBook Frontend Roadmap

## Goal

Build the SweetBook frontend MVP as a clean, responsive client that supports group creation, event creation, photo upload, likes, album candidate review, and order flow entry points.

## Frontend Scope

This repository owns the frontend experience only:

- application shell and navigation
- responsive MVP screens for group, event, photo, like, candidate, and order flows
- client-side state, loading, error, and empty states
- API consumption boundaries for the backend MVP
- UI validation, accessibility, and delivery hardening

## Non-Goals

- backend business logic implementation
- album selection rules
- SweetBook payload generation
- SweetBook API integration details
- order lifecycle persistence or webhook handling
- advanced editor workflows or non-MVP features

## Architecture Direction

- presentation layer owns pages, routing, UI composition, and view state
- application layer owns client-side orchestration and data loading boundaries
- domain layer, if used, stays framework independent and minimal
- shared UI and utilities should remain reusable and isolated from backend details
- tests should cover route flow, state transitions, and user-visible behavior before polish

## Delivery Phases

### Phase 1: Frontend Bootstrap

- confirm frontend stack and project conventions
- establish application shell, routing, and base styling
- create test harness and component structure

### Phase 2: Core MVP Shell

- build shared layout, navigation, and responsive page chrome
- wire base client-side state patterns
- establish loading, error, and empty states

### Phase 3: Group and Event Workflows

- create group and event screens
- support event context and navigation between screens
- align UI with backend workflow assumptions

### Phase 4: Photo and Like Experience

- add photo upload flow
- add like interaction and feedback states
- display selected-photo or ranking context where needed

### Phase 5: Candidate and Order Entry

- show album candidate review surfaces
- expose order flow entry points
- keep SweetBook-specific integration details behind UI boundaries

### Phase 6: Validation and Hardening

- run accessibility and responsive validation
- confirm regressions are covered
- verify delivery readiness and README/setup updates if needed

## Key Risks

- frontend structure may drift from backend contract shape if API boundaries are not kept explicit
- responsive MVP screens can become brittle without early shared layout conventions
- delivery flow may need adjustment once backend adapters are exposed through real endpoints

## Completion Criteria

- frontend MVP screens are implemented and test-covered
- UI boundaries cleanly separate presentation from backend integration details
- accessibility and responsive behavior pass final validation
- frontend is ready for iterative integration against the backend MVP
