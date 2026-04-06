import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getPrototypePhotoWorkflowViewModel,
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

describe("frontend photo upload and like screens", () => {
  it("provides event-scoped photo workflow data through the application boundary", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const workflow = getPrototypePhotoWorkflowViewModel(workspace.events[0]?.id ?? "");

    expect(workflow.activeEventName).toBe("First birthday album");
    expect(workflow.uploadState.pendingCount).toBe(3);
    expect(workflow.photos[0]?.likedByViewer).toBe(true);
    expect(workflow.photos[1]?.likeCount).toBe(9);
  });

  it("renders upload guidance and photo status inside the event screen", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events", initialSession: demoSession }),
    );

    expect(markup).toContain("Upload photos");
    expect(markup).toContain("New photo caption");
    expect(markup).toContain("Photo file");
    expect(markup).toContain("3 pending uploads");
    expect(markup).toContain("124 already in the event");
    expect(markup).toContain("Upload queue is local-only until backend adapters land.");
  });

  it("renders like feedback for event photos", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "events", initialSession: demoSession }),
    );

    expect(markup).toContain("Like feedback");
    expect(markup).toContain("Like photo");
    expect(markup).toContain("Liked by you");
    expect(markup).toContain("9 likes");
    expect(markup).toContain("No file selected");
    expect(markup).toContain("Choose favorites before candidate review begins.");
  });
});
