import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";
import { DashboardScreen } from "../src/presentation/screens/dashboard-screen";
import { EventScreen } from "../src/presentation/screens/event-screen";
import { GroupScreen } from "../src/presentation/screens/group-screen";

describe("dashboard and group completion summaries", () => {
  it("shows recent SweetBook completions on the dashboard", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const markup = renderToStaticMarkup(
      <DashboardScreen
        workspace={workspace}
        groupedEvents={[]}
        submittedOrdersByEvent={{
          "event-birthday": {
            bookUid: "bk_123",
            groupId: "group-han",
            groupName: "Han family",
            orderStatusDisplay: "paid",
            orderUid: "ord_123",
          },
        }}
      />,
    );

    expect(markup).toContain("Recent SweetBook completions");
    expect(markup).toContain("Completed groups to revisit");
    expect(markup).toContain("Groups still in progress");
    expect(markup).toContain("No active group work remains right now.");
    expect(markup).toContain("Order ord_123 for book bk_123");
    expect(markup).toContain("Review completed group");
    expect(markup).toContain("Open completed group page");
  });

  it("shows completed handoff details on the group page", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const activeGroup = workspace.groups[0];
    const events = workspace.events.filter((event) => event.groupName === activeGroup?.name);
    const markup = renderToStaticMarkup(
      <GroupScreen
        activeGroupName={activeGroup?.name}
        events={events}
        members={[
          {
            userId: "user-demo",
            displayName: "SweetBook Demo User",
            role: "Owner",
          },
        ]}
        workspace={workspace}
        submittedOrdersByEvent={{
          "event-birthday": {
            bookUid: "bk_456",
            orderStatusDisplay: "paid",
            orderUid: "ord_456",
          },
        }}
      />,
    );

    expect(markup).toContain("1 SweetBook handoff completed in this group.");
    expect(markup).toContain("Completed handoffs");
    expect(markup).toContain("Open completed event");
    expect(markup).toContain("SweetBook order completed");
    expect(markup).toContain("Order ord_456 was submitted for book bk_456");
  });

  it("shows completion context on the event page once an order was submitted", () => {
    const workspace = getPrototypeWorkspaceViewModel();
    const markup = renderToStaticMarkup(
      <EventScreen
        selectedEventId="event-birthday"
        selectedGroupName="Han family"
        submittedOrder={{
          bookUid: "bk_789",
          orderStatusDisplay: "paid",
          orderUid: "ord_789",
        }}
        workspace={workspace}
      />,
    );

    expect(markup).toContain("SweetBook order already completed");
    expect(markup).toContain("Order ord_789 was submitted for book bk_789");
  });
});
