import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getPrototypeCandidateReviewViewModel,
  getPrototypeWorkspaceViewModel,
} from "../src/application/prototype-workspace";
import { buildAppShell } from "../src/presentation/app";

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
      buildAppShell({ currentRouteKey: "albums" }),
    );

    expect(markup).toContain("Album candidate review");
    expect(markup).toContain("Top picks for First birthday album");
    expect(markup).toContain("Rank 1");
    expect(markup).toContain("Family portrait");
    expect(markup).toContain("Selected because this photo combines strong likes");
  });

  it("renders a page preview surface before order entry begins", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "albums" }),
    );

    expect(markup).toContain("Page preview");
    expect(markup).toContain("Cover preview");
    expect(markup).toContain("Page 2");
    expect(markup).toContain("Review the draft spread before entering the order flow.");
  });
});
