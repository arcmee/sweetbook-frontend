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

  function setInputValue(input: HTMLInputElement | null, value: string): void {
    if (!input) {
      return;
    }

    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

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

  it("reveals submit action after a ready estimate and shows the submitted order", async () => {
    const requestEstimate = vi.fn().mockResolvedValue({
      status: "ready_for_order",
      bookUid: "bk_123",
      uploadedPhotoFileName: "photo-1.jpg",
      pageCount: 24,
      contentInsertions: [],
      estimate: {
        totalAmount: 3100,
        paidCreditAmount: 3100,
        creditBalance: 5000,
        creditSufficient: true,
        currency: "KRW",
      },
    });
    const requestSubmit = vi.fn().mockResolvedValue({
      status: "submitted",
      bookUid: "bk_123",
      uploadedPhotoFileName: "photo-1.jpg",
      pageCount: 24,
      contentInsertions: [],
      estimate: {
        totalAmount: 3100,
        paidCreditAmount: 3100,
        creditBalance: 5000,
        creditSufficient: true,
        currency: "KRW",
      },
      order: {
        orderUid: "ord_1",
        orderStatus: 20,
        orderStatusDisplay: "결제완료",
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
          coverPhotoCaption: "Cake table setup",
          estimatedPageCount: 6,
          pageLayouts: {
            cover: "Title-first cover",
            "spread-1": "Single-photo spotlight",
            "spread-2": "Caption-led story spread",
          },
          pageNotes: {
            cover: "Open with the portrait and title lockup.",
            "spread-1": "Pair the balloon detail with the family wide shot.",
            "spread-2": "Use the final spread for the celebration closer.",
          },
          selectedPhotoCount: 3,
          selectedPhotoCaptions: [
            "Cake table setup",
            "Balloon arch",
            "Family group shot",
          ],
          requestEstimate,
          requestSubmit,
        }),
      );
    });

    const estimateButton = container.querySelector("button");
    await act(async () => {
      estimateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("SweetBook estimate is ready");
    expect(container.textContent).toContain("available for submission");
    expect(container.textContent).toContain("Chosen cover: Cake table setup");
    expect(container.textContent).toContain("Cover candidate: Cake table setup");
    expect(container.textContent).toContain("Estimated draft pages: 6");
    expect(container.textContent).toContain(
      "Story spreads: Cake table setup, Balloon arch, Family group shot",
    );
    expect(container.textContent).toContain("Cover handoff: Title-first cover");
    expect(container.textContent).toContain(
      "Open with the portrait and title lockup.",
    );
    expect(container.textContent).toContain("Status: Ready");
    expect(container.textContent).toContain("1 photo slot planned");
    expect(container.textContent).toContain("Spread 1: Single-photo spotlight");
    expect(container.textContent).toContain(
      "Pair the balloon detail with the family wide shot.",
    );
    expect(container.textContent).toContain("Status: Needs review");
    expect(container.textContent).toContain(
      "Warning: Single-photo spotlight works best with one photo.",
    );
    expect(container.textContent).toContain("2 photo slots planned");
    expect(container.textContent).toContain("Balloon arch, Family group shot");
    expect(container.textContent).toContain("Spread 2: Caption-led story spread");
    expect(container.textContent).toContain(
      "Use the final spread for the celebration closer.",
    );
    expect(container.textContent).toContain("Checkout setup");
    expect(container.textContent).toContain("Delivery details");
    expect(container.textContent).toContain("Checkout summary");
    expect(container.textContent).toContain("Owner-approved selection count: 3");
    expect(container.textContent).toContain("SweetBook draft pages queued: 6");
    expect(container.textContent).toContain("SweetBook unit price: 3100 KRW");
    expect(container.textContent).toContain("Total due today: 3400 KRW");

    const quantitySelect = container.querySelector(
      'select[name="bookQuantity"]',
    ) as HTMLSelectElement | null;
    const paymentNameInput = container.querySelector(
      'input[name="paymentName"]',
    ) as HTMLInputElement | null;
    const paymentCardInput = container.querySelector(
      'input[name="paymentCardLastFour"]',
    ) as HTMLInputElement | null;
    const recipientNameInput = container.querySelector(
      'input[name="recipientName"]',
    ) as HTMLInputElement | null;
    const deliveryNoteInput = container.querySelector(
      'input[name="deliveryNote"]',
    ) as HTMLInputElement | null;

    await act(async () => {
      if (quantitySelect) {
        quantitySelect.value = "2";
        quantitySelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      if (paymentNameInput) {
        setInputValue(paymentNameInput, "Demo Owner");
      }
      if (paymentCardInput) {
        setInputValue(paymentCardInput, "4242");
      }
      if (recipientNameInput) {
        setInputValue(recipientNameInput, "Han Family");
      }
      if (deliveryNoteInput) {
        setInputValue(deliveryNoteInput, "Leave at front desk");
      }
    });

    expect(container.textContent).toContain("Quantity subtotal: 6200 KRW");
    expect(container.textContent).toContain("Prototype platform fee: 600 KRW");
    expect(container.textContent).toContain("Total due today: 6800 KRW");
    expect(container.textContent).toContain("Delivery note: Leave at front desk");

    const buttons = Array.from(container.querySelectorAll("button"));
    const submitButton = buttons.find((button) => button.textContent === "Submit SweetBook order");
    expect(submitButton?.textContent).toBe("Submit SweetBook order");

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("SweetBook order submitted");
    expect(container.textContent).toContain("Sandbox order ord_1 was submitted");
  });
});
