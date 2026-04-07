import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildAppShell } from "../src/presentation/app";
import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";

const demoSession = {
  token: "ptok_123",
  user: {
    userId: "user-demo",
    username: "demo",
    displayName: "SweetBook Demo User",
    role: "owner",
  },
} as const;

describe("frontend group and event screens", () => {
  it("provides prototype workspace data through an application boundary", () => {
    const viewModel = getPrototypeWorkspaceViewModel();

    expect(viewModel.groupSummary.totalGroups).toBe(2);
    expect(viewModel.groupSummary.totalMembers).toBe(7);
    expect(viewModel.groups[0]?.name).toBe("Han family");
    expect(viewModel.events[0]?.groupName).toBe("Han family");
  });

  it("renders a group management screen with creation guidance", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "groups", initialSession: demoSession }),
    );

    expect(markup).toContain("Group page");
    expect(markup).toContain("Events in this group");
    expect(markup).toContain("Create event in this group");
    expect(markup).toContain("Event description");
    expect(markup).toContain("Voting opens");
    expect(markup).toContain("Han family");
    expect(markup).toContain("Group members");
  });

  it("renders a main dashboard grouped by family events", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "dashboard", initialSession: demoSession }),
    );

    expect(markup).toContain("Active family voting");
    expect(markup).toContain("What needs your attention");
    expect(markup).toContain("No urgent actions are waiting right now.");
    expect(markup).toContain("Open group page");
    expect(markup).toContain("Han family");
    expect(markup).toContain("First birthday album");
  });

  it("renders an event management screen with a selected group context", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events", initialSession: demoSession }),
    );

    expect(markup).toContain("Event page");
    expect(markup).toContain("Active group");
    expect(markup).toContain("First birthday album");
    expect(markup).toContain("Collect the best first birthday moments before the family vote closes.");
    expect(markup).toContain("Members upload event photos here and vote during the active collection window.");
    expect(markup).toContain("Voting status badge");
    expect(markup).toContain("Voting in progress");
    expect(markup).toContain("Time left to vote:");
    expect(markup).toContain("Owner voting controls");
  });
});
