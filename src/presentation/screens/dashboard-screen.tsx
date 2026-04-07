import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type {
  PrototypeDashboardGroupViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type DashboardSubmittedOrderSummary = {
  bookUid: string;
  groupId: string;
  groupName: string;
  orderStatusDisplay?: string | null;
  orderUid: string;
};

type DashboardActionViewModel = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
};

type DashboardScreenProps = {
  createGroupName?: string;
  groupedEvents: PrototypeDashboardGroupViewModel[];
  isCreatingGroup?: boolean;
  nextActions?: DashboardActionViewModel[];
  onCreateGroup?: () => void | Promise<void>;
  onCreateGroupNameChange?: (value: string) => void;
  onOpenGroup?: (groupId: string) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenOwnerReview?: (eventId: string) => void;
  recentlyJoinedGroupName?: string | null;
  submittedOrdersByEvent?: Record<string, DashboardSubmittedOrderSummary>;
  workspace: PrototypeWorkspaceViewModel;
};

export function DashboardScreen({
  createGroupName = "",
  groupedEvents,
  isCreatingGroup = false,
  nextActions = [],
  onCreateGroup,
  onCreateGroupNameChange,
  onOpenGroup,
  onOpenEvent,
  onOpenOwnerReview,
  recentlyJoinedGroupName = null,
  submittedOrdersByEvent = {},
  workspace,
}: DashboardScreenProps): ReactElement {
  const completedOrders = Object.entries(submittedOrdersByEvent);
  const inProgressGroups = groupedEvents
    .map((group) => ({
      ...group,
      events: group.events.filter((event) => !submittedOrdersByEvent[event.eventId]),
    }))
    .filter((group) => group.events.length > 0);
  const urgentVotingEvents = workspace.events.filter(
    (event) =>
      event.status === "collecting" &&
      isVotingClosingSoon(event.votingEndsAt) &&
      !submittedOrdersByEvent[event.id],
  );
  const ownerReviewEvents = workspace.events.filter(
    (event) =>
      event.status === "ready" &&
      event.canOwnerSelectPhotos &&
      !submittedOrdersByEvent[event.id],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreateGroup?.();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreateGroupNameChange?.(event.target.value);
  }

  return (
    <>
      <PageSection
        eyebrow="Main dashboard"
        title="Active family voting"
        description="Track current voting events by group and jump into the event that still needs action."
      >
        <h3>Workspace snapshot</h3>
        {recentlyJoinedGroupName ? (
          <StatePanel
            tone="success"
            title={`You recently joined ${recentlyJoinedGroupName}`}
            description="Use the next actions below to jump back into the family voting flow."
          />
        ) : null}
        <form onSubmit={handleSubmit}>
          <label>
            New group name
            <input
              name="groupName"
              value={createGroupName}
              onChange={handleNameChange}
            />
          </label>
          <PrimaryAction
            label={isCreatingGroup ? "Creating family group..." : "Create a family group"}
            disabled={isCreatingGroup || createGroupName.trim().length === 0}
            type="submit"
          />
        </form>
        <p>
          {workspace.groupSummary.totalGroups} groups and {workspace.groupSummary.totalMembers} members
          are active in the prototype workspace.
        </p>
        <p>{countActiveVotingEvents(groupedEvents)} active voting events are running right now.</p>
        <p>{completedOrders.length} SweetBook handoff{completedOrders.length === 1 ? "" : "s"} completed in this session.</p>
      </PageSection>
      <PageSection
        eyebrow="Next actions"
        title="What needs your attention"
        description="Jump back into the event or group that still needs action."
      >
        {nextActions.length > 0 ? (
          <ul>
            {nextActions.map((action) => (
              <li key={action.id}>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
                <PrimaryAction label={action.ctaLabel} onClick={action.onCta} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No urgent actions are waiting right now.</p>
        )}
      </PageSection>
      <PageSection
        eyebrow="Urgent events"
        title="Voting closing soon"
        description="These events need reactions before the voting window closes."
      >
        {urgentVotingEvents.length > 0 ? (
          <ul>
            {urgentVotingEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.name}</strong>
                <p>
                  {event.groupName} closes on {formatVotingDate(event.votingEndsAt)}.
                </p>
                <PrimaryAction label="Vote in this event" onClick={() => onOpenEvent?.(event.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No live voting windows are close to deadline right now.</p>
        )}
      </PageSection>
      <PageSection
        eyebrow="Owner review"
        title="Ready for owner selection"
        description="These events finished voting and are waiting on the group owner."
      >
        {ownerReviewEvents.length > 0 ? (
          <ul>
            {ownerReviewEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.name}</strong>
                <p>{event.groupName} is ready for final photo selection and SweetBook handoff.</p>
                <PrimaryAction label="Open owner review" onClick={() => onOpenOwnerReview?.(event.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No events are waiting for owner review right now.</p>
        )}
      </PageSection>
      <PageSection
        eyebrow="Priority groups"
        title="Groups still in progress"
        description="Use this list to focus on groups that still need voting, owner review, or handoff work."
      >
        {inProgressGroups.length > 0 ? (
          <ul>
            {inProgressGroups.map((group) => {
              const liveEvents = group.events.filter((event) => event.status === "collecting");
              return (
                <li key={group.groupId}>
                  <strong>{group.groupName}</strong>
                  <p>
                    {liveEvents.length > 0
                      ? `${liveEvents.length} live voting event${liveEvents.length === 1 ? "" : "s"} right now.`
                      : "This group still has unfinished event work."}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No active group work remains right now.</p>
        )}
      </PageSection>
      {completedOrders.length > 0 ? (
        <PageSection
          eyebrow="Follow-up"
          title="Completed groups to revisit"
          description="These groups already reached SweetBook submission and are ready for post-order review."
        >
          <ul>
            {completedOrders.map(([eventId, order]) => (
              <li key={`completed-group-${eventId}`}>
                <strong>{order.groupName}</strong>
                <p>
                  Submitted order {order.orderUid} is complete. Reopen the group to review the finished event.
                </p>
                <PrimaryAction label="Review completed group" onClick={() => onOpenGroup?.(order.groupId)} />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}
      {completedOrders.length > 0 ? (
        <PageSection
          eyebrow="Completed orders"
          title="Recent SweetBook completions"
          description="Track recently submitted books and jump back into the matching group."
        >
          <ul>
            {completedOrders.map(([eventId, order]) => (
              <li key={eventId}>
                <strong>{order.groupName}</strong>
                <p>
                  Order {order.orderUid} for book {order.bookUid}
                  {order.orderStatusDisplay ? ` (${order.orderStatusDisplay})` : ""}.
                </p>
                <PrimaryAction label="Open completed group page" onClick={() => onOpenGroup?.(order.groupId)} />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}
      {inProgressGroups.map((group) => (
        <PageSection
          key={group.groupId}
          eyebrow="Group"
          title={group.groupName}
          description="Current events in this family group that still need action."
        >
          <PrimaryAction label="Open group page" onClick={() => onOpenGroup?.(group.groupId)} />
          <ul>
            {group.events.map((event) => (
              <li key={event.eventId}>
                <button type="button" onClick={() => onOpenEvent?.(event.eventId)}>
                  <strong>{event.eventName}</strong>
                </button>
                <span> {getDashboardEventLabel(event.status)}</span>
                {submittedOrdersByEvent[event.eventId] ? (
                  <p>
                    SweetBook order {submittedOrdersByEvent[event.eventId]?.orderUid} submitted.
                  </p>
                ) : null}
                <div>
                  {event.previewPhotos.length > 0 ? (
                    <ul>
                      {event.previewPhotos.map((photo) => (
                        <li key={photo.photoId}>
                          <span>{photo.caption}</span>
                          <span> {photo.likeCount} likes</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No photo previews yet.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </PageSection>
      ))}
    </>
  );
}

function countActiveVotingEvents(groups: PrototypeDashboardGroupViewModel[]): number {
  return groups.reduce(
    (count, group) =>
      count + group.events.filter((event) => event.status === "collecting").length,
    0,
  );
}

function getDashboardEventLabel(status: PrototypeDashboardGroupViewModel["events"][number]["status"]): string {
  if (status === "collecting") {
    return "Voting live";
  }

  if (status === "draft") {
    return "Voting opens later";
  }

  return "Ready for owner review";
}

function isVotingClosingSoon(value?: string): boolean {
  if (!value) {
    return false;
  }

  const endsAt = new Date(value);
  if (Number.isNaN(endsAt.valueOf())) {
    return false;
  }

  const diffMs = endsAt.valueOf() - Date.now();
  const fortyEightHours = 1000 * 60 * 60 * 48;

  return diffMs > 0 && diffMs <= fortyEightHours;
}

function formatVotingDate(value?: string): string {
  if (!value) {
    return "the scheduled deadline";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
