// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";
import { OrderHandoffScreen } from "../src/presentation/screens/order-handoff-screen";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("order handoff interaction", () => {
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    while (containers.length > 0) {
      const container = containers.pop();
      container?.remove();
    }
    document.body.innerHTML = "";
  });

  it("shows the insufficient-credit estimate summary after the action runs", async () => {
    const requestEstimate = vi.fn().mockResolvedValue({
      status: "blocked_insufficient_credit",
      bookUid: "bk_123",
      uploadedPhotoFileName: "photo-1.jpg",
      pageCount: 24,
      contentInsertions: [],
      estimate: {
        totalAmount: 3100,
        paidCreditAmount: 3410,
        creditBalance: 2590,
        creditSufficient: false,
        currency: "KRW",
      },
    });

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(OrderHandoffScreen, {
          workspace: getPrototypeWorkspaceViewModel(),
          requestEstimate,
        }),
      );
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Start SweetBook order");

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(requestEstimate).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("SweetBook credits need a top-up");
    expect(container.textContent).toContain("Need 3410 KRW, current balance 2590 KRW.");
  });

  it("shows an error panel when the estimate request fails", async () => {
    const requestEstimate = vi
      .fn()
      .mockRejectedValue(new Error("Failed to run prototype SweetBook estimate: 503"));

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(OrderHandoffScreen, {
          workspace: getPrototypeWorkspaceViewModel(),
          requestEstimate,
        }),
      );
    });

    const button = container.querySelector("button");

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("SweetBook estimate failed");
    expect(container.textContent).toContain(
      "Failed to run prototype SweetBook estimate: 503",
    );
  });
});
