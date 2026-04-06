import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getPrototypeCandidateReviewViewModel,
  getPrototypeWorkspaceViewModel,
} from "../src/application/prototype-workspace";
import { buildAppShell } from "../src/presentation/app";

const demoSession = {
  token: "ptok_123",
  user: {
    userId: "user-demo",
    username: "demo",
    displayName: "SweetBook Demo User",
    role: "owner",
  },
} as const;

describe("frontend album candidate review", () => {
  it("provides candidate review data through the application boundary", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const review = getPrototypeCandidateReviewViewModel(workspace.events[0]?.id ?? "");

    expect(review.activeEventName).toBe("First birthday album");
    expect(review.candidates[0]?.rank).toBe(1);
    expect(review.candidates[0]?.whySelected).toContain("likes");
    expect(review.pagePreview[0]?.photoCaptions).toContain("Cake table setup");
  });

  it("renders candidate ranking and review copy on the albums route", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "albums", initialSession: demoSession }),
    );

    expect(markup).toContain("Owner selection opens after voting ends");
    expect(markup).toContain("Only the group owner can open selection after the voting window has ended or has been closed.");
  });

  it("renders a page preview surface before order entry begins", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "albums", initialSession: demoSession }),
    );

    expect(markup).toContain("Owner selection opens after voting ends");
  });
});
