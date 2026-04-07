import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getPrototypeWorkspaceViewModel } from "../src/application/prototype-workspace";
import { DashboardScreen } from "../src/presentation/screens/dashboard-screen";
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
    expect(markup).toContain("Order ord_123 for book bk_123");
    expect(markup).toContain("Open group page");
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
    expect(markup).toContain("SweetBook order completed");
    expect(markup).toContain("Order ord_456 was submitted for book bk_456");
  });
});
