import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  getPrototypeOrderEntryViewModel,
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

describe("frontend order entry and handoff", () => {
  it("provides prototype order-entry data through the application boundary", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const orderEntry = getPrototypeOrderEntryViewModel(workspace.events[0]?.id ?? "");

    expect(orderEntry.activeEventName).toBe("First birthday album");
    expect(orderEntry.selectedCandidateCount).toBe(3);
    expect(orderEntry.handoffSummary.bookFormat).toBe("Hardcover square");
    expect(orderEntry.handoffSummary.payloadSections).toContain("selected photos");
  });

  it("renders the order-start summary on the orders route", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "orders", initialSession: demoSession }),
    );

    expect(markup).toContain("Order handoff is locked while voting is still open");
    expect(markup).toContain(
      "Finish voting and complete owner selection before the SweetBook order handoff becomes available.",
    );
  });

  it("renders the SweetBook handoff preview before submission", () => {
    const markup = renderToStaticMarkup(
      buildAppShell({ currentRouteKey: "orders", initialSession: demoSession }),
    );

    expect(markup).toContain("Order handoff is locked while voting is still open");
  });
});
