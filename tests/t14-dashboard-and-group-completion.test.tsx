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

    expect(markup).toContain("Recent SweetBook operation completions");
    expect(markup).toContain("Completed SweetBook operations");
    expect(markup).toContain("Groups still in progress");
    expect(markup).toContain("SweetBook handoff queue");
    expect(markup).toContain("0 owner review ready");
    expect(markup).toContain("0 blocked by voting or setup");
    expect(markup).toContain("1 submitted");
    expect(markup).toContain("No active group work remains right now.");
    expect(markup).toContain("Order ord_123 for book bk_123");
    expect(markup).toContain("Review completed operation");
    expect(markup).toContain("Open completed operation");
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
    expect(markup).toContain("SweetBook operations");
    expect(markup).toContain("0 waiting for owner review");
    expect(markup).toContain("0 still blocked by voting or setup");
    expect(markup).toContain("1 completed");
    expect(markup).toContain("Completed SweetBook operations");
    expect(markup).toContain(
      "Use this archive to revisit events that already finished the SweetBook submission flow.",
    );
    expect(markup).toContain("Open completed operation");
    expect(markup).toContain("Final status: paid");
    expect(markup).toContain("SweetBook operation completed");
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

    expect(markup).toContain("SweetBook operation already completed");
    expect(markup).toContain("SweetBook operation");
    expect(markup).toContain("SweetBook operation completed for this event.");
    expect(markup).toContain("Order ord_789 is already archived for this event.");
    expect(markup).toContain("Completed SweetBook operation");
    expect(markup).toContain("Book draft: bk_789");
    expect(markup).toContain("Order reference: ord_789");
    expect(markup).toContain("Final order state: paid");
    expect(markup).toContain("Order ord_789 was submitted for book bk_789");
  });

  it("highlights urgent voting and owner review queues", () => {
    const workspace = {
      ...getPrototypeWorkspaceViewModel(),
      events: [
        {
          id: "event-soon",
          name: "Picnic vote",
          groupName: "Han family",
          status: "collecting" as const,
          description: "Vote before the picnic deadline ends.",
          votingStartsAt: "2026-04-07T00:00:00.000Z",
          votingEndsAt: "2026-04-08T00:00:00.000Z",
          canVote: true,
          canOwnerSelectPhotos: false,
          photoCount: 12,
        },
        {
          id: "event-ready",
          name: "Owner review queue",
          groupName: "Han family",
          status: "ready" as const,
          description: "Ready for final owner selection.",
          votingStartsAt: "2026-04-01T00:00:00.000Z",
          votingEndsAt: "2026-04-05T00:00:00.000Z",
          canVote: false,
          canOwnerSelectPhotos: true,
          photoCount: 8,
        },
      ],
    };
    const dashboardMarkup = renderToStaticMarkup(
      <DashboardScreen workspace={workspace} groupedEvents={[]} />,
    );
    const groupMarkup = renderToStaticMarkup(
      <GroupScreen
        activeGroupName="Han family"
        events={workspace.events}
        members={[
          {
            userId: "user-demo",
            displayName: "SweetBook Demo User",
            role: "Owner",
          },
        ]}
        workspace={workspace}
      />,
    );

    expect(dashboardMarkup).toContain("Voting closing soon");
    expect(dashboardMarkup).toContain("Vote in this event");
    expect(dashboardMarkup).toContain("Ready for owner selection");
    expect(dashboardMarkup).toContain("Open SweetBook operation");
    expect(dashboardMarkup).toContain("SweetBook handoff queue");
    expect(dashboardMarkup).toContain("1 owner review ready");
    expect(dashboardMarkup).toContain("1 blocked by voting or setup");
    expect(dashboardMarkup).toContain("0 submitted");

    expect(groupMarkup).toContain("Attention needed");
    expect(groupMarkup).toContain("SweetBook operations");
    expect(groupMarkup).toContain("1 waiting for owner review");
    expect(groupMarkup).toContain("1 still blocked by voting or setup");
    expect(groupMarkup).toContain("0 completed");
    expect(groupMarkup).toContain("Open urgent vote");
    expect(groupMarkup).toContain("This event is ready for owner photo selection and SweetBook handoff.");
    expect(groupMarkup).toContain("SweetBook flow: Still collecting votes before owner review can open.");
    expect(groupMarkup).toContain("SweetBook flow: Waiting for owner review and SweetBook handoff.");
  });
});
