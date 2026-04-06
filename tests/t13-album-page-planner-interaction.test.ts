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
});
