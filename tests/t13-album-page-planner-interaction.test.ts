// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";
import { AlbumCandidateScreen } from "../src/presentation/screens/album-candidate-screen";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("album page planner interaction", () => {
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    while (containers.length > 0) {
      const container = containers.pop();
      container?.remove();
    }
    document.body.innerHTML = "";
  });

  it("allows moving spread photos directly from the page preview cards", async () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const moveEarlier = vi.fn();
    const moveLater = vi.fn();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AlbumCandidateScreen, {
          workspace,
          activeGroupName: "Han family",
          activeEventName: "First birthday album",
          workflow: {
            activeEventId: "evt-demo",
            activeEventName: "First birthday album",
            canVote: false,
            photoCountLabel: "3 uploaded",
            photos: [
              {
                id: "photo-1",
                caption: "Cake table setup",
                likeCount: 12,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
              {
                id: "photo-2",
                caption: "Balloon arch",
                likeCount: 9,
                likedByViewer: false,
                uploadedBy: "Jules",
              },
              {
                id: "photo-3",
                caption: "Family group shot",
                likeCount: 8,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
            ],
          },
          selectedPhotoIds: ["photo-1", "photo-2", "photo-3"],
          coverPhotoId: "photo-1",
          onMovePhotoEarlier: moveEarlier,
          onMovePhotoLater: moveLater,
        }),
      );
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const moveLaterButton = buttons.find(
      (button) =>
        button.textContent === "Move to next page" &&
        !(button as HTMLButtonElement).disabled,
    );
    const moveEarlierButton = buttons.find(
      (button) =>
        button.textContent === "Move to previous page" &&
        !(button as HTMLButtonElement).disabled,
    );

    await act(async () => {
      moveLaterButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      moveEarlierButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("2 photo slots planned");
    expect(moveLater).toHaveBeenCalledWith("photo-2");
    expect(moveEarlier).toHaveBeenCalledWith("photo-3");
  });

  it("offers recommended fixes when a page layout needs review", async () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const setPageLayout = vi.fn();
    const setPageNote = vi.fn();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AlbumCandidateScreen, {
          workspace,
          activeGroupName: "Han family",
          activeEventName: "First birthday album",
          workflow: {
            activeEventId: "evt-demo",
            activeEventName: "First birthday album",
            canVote: false,
            photoCountLabel: "3 uploaded",
            photos: [
              {
                id: "photo-1",
                caption: "Cake table setup",
                likeCount: 12,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
              {
                id: "photo-2",
                caption: "Balloon arch",
                likeCount: 9,
                likedByViewer: false,
                uploadedBy: "Jules",
              },
              {
                id: "photo-3",
                caption: "Family group shot",
                likeCount: 8,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
            ],
          },
          selectedPhotoIds: ["photo-1", "photo-2", "photo-3"],
          coverPhotoId: "photo-1",
          pageLayouts: { "spread-1": "Single-photo spotlight" },
          pageNotes: { "spread-1": "" },
          onSetPageLayout: setPageLayout,
          onSetPageNote: setPageNote,
        }),
      );
    });

    expect(container.textContent).toContain("Needs review");
    expect(container.textContent).toContain(
      "Warning: Add an edit note before sending this page to SweetBook.",
    );

    const buttons = Array.from(container.querySelectorAll("button"));
    const suggestedLayoutButton = buttons.find(
      (button) => button.textContent === "Use recommended layout",
    );
    const suggestedNoteButton = buttons.find(
      (button) => button.textContent === "Restore suggested note",
    );

    await act(async () => {
      suggestedLayoutButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      suggestedNoteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(setPageLayout).toHaveBeenCalledWith(
      "spread-1",
      "Balanced two-photo spread",
    );
    expect(setPageNote).toHaveBeenCalledWith(
      "spread-1",
      "Use this spread to balance detail shots with group moments.",
    );
  });

  it("shows draft readiness counts and blocks order handoff while review remains", async () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AlbumCandidateScreen, {
          workspace,
          activeGroupName: "Han family",
          activeEventName: "First birthday album",
          workflow: {
            activeEventId: "evt-demo",
            activeEventName: "First birthday album",
            canVote: false,
            photoCountLabel: "3 uploaded",
            photos: [
              {
                id: "photo-1",
                caption: "Cake table setup",
                likeCount: 12,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
              {
                id: "photo-2",
                caption: "Balloon arch",
                likeCount: 9,
                likedByViewer: false,
                uploadedBy: "Jules",
              },
              {
                id: "photo-3",
                caption: "Family group shot",
                likeCount: 8,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
            ],
          },
          selectedPhotoIds: ["photo-1", "photo-2", "photo-3"],
          coverPhotoId: "photo-1",
          pageLayouts: { "spread-1": "Single-photo spotlight" },
          pageNotes: { "spread-1": "" },
        }),
      );
    });

    expect(container.textContent).toContain("Draft readiness: 1 ready, 1 need review.");
    expect(container.textContent).toContain(
      "Next blocker: Spread 1: Add an edit note before sending this page to SweetBook.",
    );
    expect(container.textContent).toContain("Owner handoff checklist");
    expect(container.textContent).toContain("SweetBook handoff summary");
    expect(container.textContent).toContain("Status: Blocked");
    expect(container.textContent).toContain("Cover payload: Cake table setup");
    expect(container.textContent).toContain("Spread payload count: 2");
    expect(container.textContent).toContain("Draft page payload count: 2");
    expect(container.textContent).toContain("Done: Choose a cover photo");
    expect(container.textContent).toContain(
      "Done: Approve at least 3 photos for the draft",
    );
    expect(container.textContent).toContain(
      "Pending: Record owner approval for the draft",
    );
    expect(container.textContent).toContain(
      "The group owner still needs to approve this draft before handoff.",
    );
    expect(container.textContent).toContain(
      "Pending: Resolve all draft page warnings",
    );
    expect(container.textContent).toContain(
      "Resolve the flagged pages before opening the SweetBook order handoff.",
    );
    expect(container.textContent).toContain(
      "Spread 1: Add an edit note before sending this page to SweetBook.",
    );
    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Continue to order setup",
    ) as HTMLButtonElement | undefined;
    expect(continueButton?.disabled).toBe(true);
  });

  it("opens order handoff once every draft page is ready", async () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AlbumCandidateScreen, {
          workspace,
          activeGroupName: "Han family",
          activeEventName: "First birthday album",
          workflow: {
            activeEventId: "evt-demo",
            activeEventName: "First birthday album",
            canVote: false,
            photoCountLabel: "3 uploaded",
            photos: [
              {
                id: "photo-1",
                caption: "Cake table setup",
                likeCount: 12,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
              {
                id: "photo-2",
                caption: "Balloon arch",
                likeCount: 9,
                likedByViewer: false,
                uploadedBy: "Jules",
              },
              {
                id: "photo-3",
                caption: "Family group shot",
                likeCount: 8,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
            ],
          },
          selectedPhotoIds: ["photo-1", "photo-2", "photo-3"],
          coverPhotoId: "photo-1",
        }),
      );
    });

    expect(container.textContent).toContain("Draft readiness: 2 ready, 0 need review.");
    expect(container.textContent).toContain(
      "Next blocker: Record owner approval for the draft.",
    );
    expect(container.textContent).toContain("Status: Blocked");
    expect(container.textContent).toContain("Draft page payload count: 2");
    expect(container.textContent).toContain("Done: Choose a cover photo");
    expect(container.textContent).toContain(
      "Done: Approve at least 3 photos for the draft",
    );
    expect(container.textContent).toContain(
      "Pending: Record owner approval for the draft",
    );
    expect(container.textContent).toContain(
      "All pages are ready. Record owner approval to continue to SweetBook handoff.",
    );
    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Continue to order setup",
    ) as HTMLButtonElement | undefined;
    expect(continueButton?.disabled).toBe(true);
  });

  it("opens order handoff once the owner has approved the draft", async () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const toggleOwnerApproval = vi.fn();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AlbumCandidateScreen, {
          workspace,
          activeGroupName: "Han family",
          activeEventName: "First birthday album",
          workflow: {
            activeEventId: "evt-demo",
            activeEventName: "First birthday album",
            canVote: false,
            photoCountLabel: "3 uploaded",
            photos: [
              {
                id: "photo-1",
                caption: "Cake table setup",
                likeCount: 12,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
              {
                id: "photo-2",
                caption: "Balloon arch",
                likeCount: 9,
                likedByViewer: false,
                uploadedBy: "Jules",
              },
              {
                id: "photo-3",
                caption: "Family group shot",
                likeCount: 8,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
            ],
          },
          selectedPhotoIds: ["photo-1", "photo-2", "photo-3"],
          coverPhotoId: "photo-1",
          isOwnerApproved: true,
          onToggleOwnerApproval: toggleOwnerApproval,
        }),
      );
    });

    expect(container.textContent).toContain(
      "Next blocker: No blockers remain. The draft can move to SweetBook handoff.",
    );
    expect(container.textContent).toContain(
      "Done: Record owner approval for the draft",
    );
    expect(container.textContent).toContain(
      "Owner approval recorded. This draft can move into SweetBook order setup.",
    );
    expect(container.textContent).toContain(
      "All pages are ready. You can continue to the SweetBook handoff.",
    );
    const approvalButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Withdraw owner approval",
    );
    expect(approvalButton).toBeDefined();
    await act(async () => {
      approvalButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(toggleOwnerApproval).toHaveBeenCalledTimes(1);
    const continueButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Continue to order setup",
    ) as HTMLButtonElement | undefined;
    expect(continueButton?.disabled).toBe(false);
  });

  it("shows owner review goals when the draft opens from the owner review queue", async () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AlbumCandidateScreen, {
          workspace,
          activeGroupName: "Han family",
          activeEventName: "First birthday album",
          openedFromOwnerReview: true,
          workflow: {
            activeEventId: "evt-demo",
            activeEventName: "First birthday album",
            canVote: false,
            photoCountLabel: "3 uploaded",
            photos: [
              {
                id: "photo-1",
                caption: "Cake table setup",
                likeCount: 12,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
              {
                id: "photo-2",
                caption: "Balloon arch",
                likeCount: 9,
                likedByViewer: false,
                uploadedBy: "Jules",
              },
              {
                id: "photo-3",
                caption: "Family group shot",
                likeCount: 8,
                likedByViewer: false,
                uploadedBy: "Ari",
              },
            ],
          },
          selectedPhotoIds: ["photo-1", "photo-2", "photo-3"],
          coverPhotoId: "photo-1",
        }),
      );
    });

    expect(container.textContent).toContain("Owner review goals");
    expect(container.textContent).toContain("Done: Lock a cover image for this event.");
    expect(container.textContent).toContain(
      "Pending: Record the final owner approval for SweetBook.",
    );
  });
});
