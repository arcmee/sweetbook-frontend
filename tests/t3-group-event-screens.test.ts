import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildAppShell } from "../src/presentation/app";
import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";

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
      buildAppShell({ currentRouteKey: "groups" }),
    );

    expect(markup).toContain("Group workspace");
    expect(markup).toContain("Create a family group");
    expect(markup).toContain("Han family");
    expect(markup).toContain("Invite relatives and define who can upload photos.");
  });

  it("renders an event management screen with a selected group context", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events" }),
    );

    expect(markup).toContain("Event timeline");
    expect(markup).toContain("Plan a new event");
    expect(markup).toContain("Active group");
    expect(markup).toContain("First birthday album");
    expect(markup).toContain("Capture milestones before moving into album selection.");
  });
});
