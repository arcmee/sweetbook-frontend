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

  function setCheckboxValue(input: HTMLInputElement | null, checked: boolean): void {
    if (!input) {
      return;
    }

    if (input.checked !== checked) {
      input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
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
          activeEventId: "event-birthday",
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
    expect(requestEstimate).toHaveBeenCalledWith({
      eventId: "event-birthday",
    });
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
          activeEventId: "event-birthday",
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
          activeEventId: "event-birthday",
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
          isOwnerApproved: false,
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
    expect(container.textContent).toContain("SweetBook operation");
    expect(container.textContent).toContain(
      "Owner approval is still required before SweetBook handoff can finish.",
    );
    expect(container.textContent).toContain(
      "Pending: Draft approved by the group owner",
    );
    expect(container.textContent).toContain("In progress: Handoff checks cleared");
    expect(container.textContent).toContain("Pending: SweetBook order submitted");
    expect(container.textContent).toContain("Chosen cover: Cake table setup");
    expect(container.textContent).toContain("Cover candidate: Cake table setup");
    expect(container.textContent).toContain("Estimated draft pages: 2");
    expect(container.textContent).toContain("Draft readiness: 2 ready, 1 need review.");
    expect(container.textContent).toContain(
      "Next blocker: Spread 1: Single-photo spotlight works best with one photo.",
    );
    expect(container.textContent).toContain("Owner handoff checklist");
    expect(container.textContent).toContain("SweetBook handoff summary");
    expect(container.textContent).toContain("SweetBook handoff timeline");
    expect(container.textContent).toContain(
      "Status: Blocked until remaining checks are resolved",
    );
    expect(container.textContent).toContain("Draft payload pages: 2");
    expect(container.textContent).toContain("Selected payload photos: 3");
    expect(container.textContent).toContain("Spread payload count: 1");
    expect(container.textContent).toContain("Backend cover payload: Cake table setup");
    expect(container.textContent).toContain("Estimated checkout total: 3400 KRW");
    expect(container.textContent).toContain("Estimate state: Ready for submission");
    expect(container.textContent).toContain("Needs review: Draft prepared");
    expect(container.textContent).toContain("Pending: Owner approval");
    expect(container.textContent).toContain("Done: Estimate check");
    expect(container.textContent).toContain("Pending: Final confirmations");
    expect(container.textContent).toContain("Pending: Order submitted");
    expect(container.textContent).toContain("SweetBook completion summary");
    expect(container.textContent).toContain("No order has been submitted yet.");
    expect(container.textContent).toContain("Done: Choose a cover photo");
    expect(container.textContent).toContain(
      "Done: Keep at least 3 owner-approved photos",
    );
    expect(container.textContent).toContain(
      "Done: Run the SweetBook estimate",
    );
    expect(container.textContent).toContain(
      "Pending: Resolve all draft page warnings",
    );
    expect(container.textContent).toContain(
      "Pending: Fill in recipient details",
    );
    expect(container.textContent).toContain(
      "Pending: Enter payer name and card digits",
    );
    expect(container.textContent).toContain(
      "Pending: Keep owner approval active for handoff",
    );
    expect(container.textContent).toContain(
      "Pending: Confirm the SweetBook draft payload",
    );
    expect(container.textContent).toContain(
      "Pending: Confirm delivery details",
    );
    expect(container.textContent).toContain(
      "Pending: Confirm the payment summary",
    );
    expect(container.textContent).toContain(
      "Resolve the flagged draft pages before this SweetBook handoff can be submitted.",
    );
    expect(container.textContent).toContain(
      "Spread 1: Single-photo spotlight works best with one photo.",
    );
    expect(container.textContent).toContain(
      "Story spreads: Cake table setup, Balloon arch, Family group shot",
    );
    expect(container.textContent).toContain("Cover handoff: Full-bleed cover");
    expect(container.textContent).toContain(
      "Lead with the strongest event-defining moment on the cover.",
    );
    expect(container.textContent).toContain("Status: Ready");
    expect(container.textContent).toContain("1 photo slot planned");
    expect(container.textContent).toContain("Spread 1: Balanced two-photo spread");
    expect(container.textContent).toContain(
      "Use this spread to balance detail shots with group moments.",
    );
    expect(container.textContent).not.toContain("Status: Needs review");
    expect(container.textContent).toContain("2 photo slots planned");
    expect(container.textContent).toContain("Family portrait, Gift opening moment");
    expect(container.textContent).toContain(
      "Use this spread to balance detail shots with group moments.",
    );
    expect(container.textContent).toContain("Checkout setup");
    expect(container.textContent).toContain("Delivery details");
    expect(container.textContent).toContain("Checkout summary");
    expect(container.textContent).toContain("Owner-approved selection count: 3");
    expect(container.textContent).toContain("SweetBook draft pages queued: 2");
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
    expect(submitButton).toBeUndefined();
    expect(requestSubmit).toHaveBeenCalledTimes(0);
  });

  it("keeps submit available when every draft page is ready", async () => {
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
        orderUid: "ord_2",
        orderStatus: 20,
        orderStatusDisplay: "paid",
      },
    });

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(OrderHandoffScreen, {
          activeEventId: "event-birthday",
          workspace: getPrototypeWorkspaceViewModel(),
          coverPhotoCaption: "Cake table setup",
          estimatedPageCount: 6,
          pageLayouts: {
            cover: "Title-first cover",
            "spread-1": "Balanced two-photo spread",
          },
          pageNotes: {
            cover: "Open with the portrait and title lockup.",
            "spread-1": "Use this spread to balance detail shots with group moments.",
          },
          selectedPhotoCount: 3,
          selectedPhotoCaptions: [
            "Cake table setup",
            "Balloon arch",
            "Family group shot",
          ],
          isOwnerApproved: true,
          requestEstimate,
          requestSubmit,
        }),
      );
    });

    const estimateButton = container.querySelector("button");
    await act(async () => {
      estimateButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Draft readiness: 3 ready, 0 need review.");
    expect(container.textContent).toContain("All draft pages are ready for SweetBook handoff.");
    expect(container.textContent).toContain(
      "Owner approval is locked. Finish the remaining handoff checks.",
    );
    expect(container.textContent).toContain("Done: Draft approved by the group owner");

    await act(async () => {
      setInputValue(
        container.querySelector('input[name="paymentName"]') as HTMLInputElement | null,
        "Demo Owner",
      );
      setInputValue(
        container.querySelector('input[name="paymentCardLastFour"]') as HTMLInputElement | null,
        "4242",
      );
      setInputValue(
        container.querySelector('input[name="recipientName"]') as HTMLInputElement | null,
        "Han Family",
      );
      setCheckboxValue(
        container.querySelector('input[name="confirmDraftPayload"]') as HTMLInputElement | null,
        true,
      );
      setCheckboxValue(
        container.querySelector('input[name="confirmDeliveryDetails"]') as HTMLInputElement | null,
        true,
      );
      setCheckboxValue(
        container.querySelector('input[name="confirmPaymentSummary"]') as HTMLInputElement | null,
        true,
      );
    });

    const submitButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Submit SweetBook order",
    );
    expect(container.textContent).toContain(
      "Done: Resolve all draft page warnings",
    );
    expect(container.textContent).toContain(
      "Done: Run the SweetBook estimate",
    );
    expect(container.textContent).toContain(
      "Done: Fill in recipient details",
    );
    expect(container.textContent).toContain(
      "Done: Enter payer name and card digits",
    );
    expect(container.textContent).toContain(
      "Done: Keep owner approval active for handoff",
    );
    expect(container.textContent).toContain(
      "Done: Confirm the SweetBook draft payload",
    );
    expect(container.textContent).toContain(
      "Done: Confirm delivery details",
    );
    expect(container.textContent).toContain(
      "Done: Confirm the payment summary",
    );
    expect(container.textContent).toContain(
      "Next blocker: No blockers remain. This draft is ready for SweetBook submission.",
    );
    expect(container.textContent).toContain("Status: Ready for handoff prep");
    expect(container.textContent).toContain(
      "Operation detail: Owner review can continue with a draft handoff summary.",
    );
    expect(container.textContent).toContain("Estimated checkout total: 3400 KRW");
    expect(container.textContent).toContain("Done: Draft prepared");
    expect(container.textContent).toContain("Done: Owner approval");
    expect(container.textContent).toContain("Done: Estimate check");
    expect(container.textContent).toContain("Done: Final confirmations");
    expect(container.textContent).toContain("Pending: Order submitted");
    expect(submitButton?.textContent).toBe("Submit SweetBook order");

    await act(async () => {
      submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(requestSubmit).toHaveBeenCalledTimes(1);
    expect(requestEstimate).toHaveBeenCalledWith({
      eventId: "event-birthday",
    });
    expect(requestSubmit).toHaveBeenCalledWith({
      eventId: "event-birthday",
    });
    expect(container.textContent).toContain("SweetBook order submitted");
    expect(container.textContent).toContain(
      "SweetBook operation completed for this draft.",
    );
    expect(container.textContent).toContain("Done: SweetBook order submitted");
    expect(container.textContent).toContain("Done: Order submitted");
    expect(container.textContent).toContain("SweetBook order ord_2 is complete.");
    expect(container.textContent).toContain(
      "Book draft bk_123 was submitted successfully.",
    );
    expect(container.textContent).toContain("Order status: paid");
  });
});
