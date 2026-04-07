import { type ChangeEvent, type FormEvent, type ReactElement } from "react";

import type {
  EventCardViewModel,
  PrototypeGroupMemberViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type GroupSubmittedOrderSummary = {
  bookUid: string;
  orderStatusDisplay?: string | null;
  orderUid: string;
};

type GroupScreenProps = {
  activeGroupName?: string;
  events: EventCardViewModel[];
  inviteQuery?: string;
  inviteResults?: Array<{ userId: string; username: string; displayName: string }>;
  isInviteOpen?: boolean;
  isInvitingMember?: boolean;
  justJoinedByInvitation?: boolean;
  members: PrototypeGroupMemberViewModel[];
  workspace: PrototypeWorkspaceViewModel;
  createEventTitle?: string;
  createEventDescription?: string;
  createEventVotingStartsAt?: string;
  createEventVotingEndsAt?: string;
  isCreatingEvent?: boolean;
  isLeavingGroup?: boolean;
  isSearchingUsers?: boolean;
  isTransferringOwner?: boolean;
  onCreateEvent?: () => void | Promise<void>;
  onCreateEventDescriptionChange?: (value: string) => void;
  onCreateEventTitleChange?: (value: string) => void;
  onCreateEventVotingStartsAtChange?: (value: string) => void;
  onCreateEventVotingEndsAtChange?: (value: string) => void;
  onInviteMember?: (userId: string) => void | Promise<void>;
  onInviteQueryChange?: (value: string) => void;
  onLeaveGroup?: () => void | Promise<void>;
  onOpenEvent?: (eventId: string) => void;
  onSearchInviteCandidates?: () => void | Promise<void>;
  onToggleInviteOpen?: () => void;
  onTransferOwner?: (userId: string) => void | Promise<void>;
  selectedGroupId?: string;
  signedInUserId?: string;
  submittedOrdersByEvent?: Record<string, GroupSubmittedOrderSummary>;
};

export function GroupScreen({
  activeGroupName,
  events,
  inviteQuery = "",
  inviteResults = [],
  isInviteOpen = false,
  isInvitingMember = false,
  justJoinedByInvitation = false,
  members,
  workspace,
  createEventTitle = "",
  createEventDescription = "",
  createEventVotingStartsAt = "",
  createEventVotingEndsAt = "",
  isCreatingEvent = false,
  isLeavingGroup = false,
  isSearchingUsers = false,
  isTransferringOwner = false,
  onCreateEvent,
  onCreateEventDescriptionChange,
  onCreateEventTitleChange,
  onCreateEventVotingStartsAtChange,
  onCreateEventVotingEndsAtChange,
  onInviteMember,
  onInviteQueryChange,
  onLeaveGroup,
  onOpenEvent,
  onSearchInviteCandidates,
  onToggleInviteOpen,
  onTransferOwner,
  selectedGroupId,
  signedInUserId,
  submittedOrdersByEvent = {},
}: GroupScreenProps): ReactElement {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreateEvent?.();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreateEventTitleChange?.(event.target.value);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    onCreateEventDescriptionChange?.(event.target.value);
  }

  const activeMembership = members.find((member) => member.userId === signedInUserId);
  const canManageMembers = activeMembership?.role === "Owner";
  const canLeaveGroup = activeMembership?.role !== "Owner";
  const votableEvents = events.filter((event) => event.canVote);

  return (
    <>
      <PageSection
        eyebrow="Group page"
        title={activeGroupName ?? "Group workspace"}
        description="Review this group's event timeline, manage members, and start new event voting."
      >
        <h3>Group operations</h3>
        <p>
          {workspace.groupSummary.totalGroups} groups, {workspace.groupSummary.totalMembers} members
          are available in the workspace.
        </p>
        <p>{selectedGroupId ? "Current group is active." : "Select a group from the main page."}</p>
        <p>{events.length} events and {members.length} members are currently linked to this group.</p>
        <p>
          {
            events.filter((event) => submittedOrdersByEvent[event.id]).length
          } SweetBook handoff{events.filter((event) => submittedOrdersByEvent[event.id]).length === 1 ? "" : "s"} completed in this group.
        </p>
        {events.some((event) => submittedOrdersByEvent[event.id]) ? (
          <div>
            <h3>Completed handoffs</h3>
            <ul>
              {events
                .filter((event) => submittedOrdersByEvent[event.id])
                .map((event) => (
                  <li key={event.id}>
                    <strong>{event.name}</strong>
                    <p>
                      Order {submittedOrdersByEvent[event.id]?.orderUid} is complete and ready for later review.
                    </p>
                    <PrimaryAction label="Open completed event" onClick={() => onOpenEvent?.(event.id)} />
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
        {justJoinedByInvitation ? (
          <>
            <StatePanel
              tone="success"
              title="You joined this group from an invitation"
              description="Review the event list and member roles before you start uploading photos or voting."
            />
            <div>
              <h3>Start here</h3>
              {votableEvents.length > 0 ? (
                <ul>
                  {votableEvents.map((event) => (
                    <li key={event.id}>
                      <strong>{event.name}</strong>
                      <span> Voting is open now.</span>
                      <PrimaryAction
                        label="Open event to vote"
                        onClick={() => onOpenEvent?.(event.id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No active voting is open in this group yet. You can still review the event list below.</p>
              )}
            </div>
          </>
        ) : null}
      </PageSection>
      <PageSection
        eyebrow="Event list"
        title="Events in this group"
        description="Create new events, monitor the voting schedule, and jump into the active event workspace."
      >
        <h3>Event operations</h3>
        <form onSubmit={handleSubmit}>
          <label>
            New event title
            <input
              name="eventTitle"
              value={createEventTitle}
              onChange={handleNameChange}
            />
          </label>
          <label>
            Event description
            <textarea
              name="eventDescription"
              value={createEventDescription}
              onChange={handleDescriptionChange}
            />
          </label>
          <label>
            Voting opens
            <input
              name="eventVotingStartsAt"
              type="datetime-local"
              value={createEventVotingStartsAt}
              onChange={(event) => onCreateEventVotingStartsAtChange?.(event.target.value)}
            />
          </label>
          <label>
            Voting closes
            <input
              name="eventVotingEndsAt"
              type="datetime-local"
              value={createEventVotingEndsAt}
              onChange={(event) => onCreateEventVotingEndsAtChange?.(event.target.value)}
            />
          </label>
          <PrimaryAction
            label={isCreatingEvent ? "Creating event..." : "Create event in this group"}
            disabled={
              isCreatingEvent ||
              createEventTitle.trim().length === 0 ||
              createEventDescription.trim().length === 0 ||
              createEventVotingStartsAt.trim().length === 0 ||
              createEventVotingEndsAt.trim().length === 0
            }
            type="submit"
          />
        </form>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              <button type="button" onClick={() => onOpenEvent?.(event.id)}>
                <strong>{event.name}</strong>
              </button>
              <p>{event.description}</p>
              <span> Status: {event.status}</span>
              <span> {event.photoCount} photos</span>
              <p>
                Voting window: {formatVotingWindow(event.votingStartsAt, event.votingEndsAt)}
              </p>
              <p>{getEventManagementHint(event)}</p>
              {submittedOrdersByEvent[event.id] ? (
                <StatePanel
                  tone="success"
                  title="SweetBook order completed"
                  description={`Order ${submittedOrdersByEvent[event.id]?.orderUid} was submitted for book ${submittedOrdersByEvent[event.id]?.bookUid}${submittedOrdersByEvent[event.id]?.orderStatusDisplay ? ` (${submittedOrdersByEvent[event.id]?.orderStatusDisplay})` : ""}.`}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </PageSection>
      <PageSection
        eyebrow="Members"
        title="Group members"
        description="Invite people into the group, review member roles, transfer ownership, and handle leave-group rules."
      >
        <h3>Member management</h3>
        <p>
          {canManageMembers
            ? "You can invite members and transfer owner access from this panel."
            : "You can review members here, but only the owner can invite or transfer ownership."}
        </p>
        <ul>
          {members.map((member) => (
            <li key={member.userId}>
              <strong>{member.displayName}</strong>
              <span> {member.role}</span>
              {canManageMembers && member.userId !== signedInUserId ? (
                <PrimaryAction
                  label={isTransferringOwner ? "Transferring owner..." : "Transfer owner"}
                  disabled={isTransferringOwner}
                  onClick={() => void onTransferOwner?.(member.userId)}
                />
              ) : null}
            </li>
          ))}
        </ul>
        <PrimaryAction
          label={isInviteOpen ? "Close invite popup" : "Invite member by ID"}
          onClick={onToggleInviteOpen}
        />
        {isInviteOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSearchInviteCandidates?.();
            }}
          >
            <label>
              Member ID search
              <input
                name="inviteQuery"
                value={inviteQuery}
                onChange={(event) => onInviteQueryChange?.(event.target.value)}
              />
            </label>
            <PrimaryAction
              label={isSearchingUsers ? "Searching..." : "Search members"}
              disabled={isSearchingUsers || inviteQuery.trim().length === 0}
              type="submit"
            />
            <ul>
              {inviteResults.map((result) => (
                <li key={result.userId}>
                  <strong>{result.displayName}</strong>
                  <span> @{result.username}</span>
                  <span> {result.userId}</span>
                  <PrimaryAction
                    label={isInvitingMember ? "Inviting..." : "Invite"}
                    disabled={isInvitingMember}
                    onClick={() => void onInviteMember?.(result.userId)}
                  />
                </li>
              ))}
            </ul>
          </form>
        ) : null}
        <PrimaryAction
          label={isLeavingGroup ? "Leaving group..." : "Leave group"}
          disabled={!canLeaveGroup || isLeavingGroup}
          onClick={() => void onLeaveGroup?.()}
        />
        {!canLeaveGroup ? (
          <p>Owners must transfer ownership before leaving the group.</p>
        ) : null}
      </PageSection>
    </>
  );
}

function formatVotingWindow(votingStartsAt?: string, votingEndsAt?: string): string {
  if (!votingStartsAt || !votingEndsAt) {
    return "Not scheduled";
  }

  return `${formatVotingDate(votingStartsAt)} -> ${formatVotingDate(votingEndsAt)}`;
}

function formatVotingDate(value: string): string {
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

function getEventManagementHint(event: EventCardViewModel): string {
  if (event.canOwnerSelectPhotos) {
    return "Voting has ended and owner photo selection is unlocked.";
  }

  if (event.canVote) {
    return "Voting is open and members can still upload photos and react.";
  }

  return "Voting is not open yet for this event.";
}
