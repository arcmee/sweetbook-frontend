import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type {
  PrototypeDashboardGroupViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

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
  recentlyJoinedGroupName?: string | null;
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
  recentlyJoinedGroupName = null,
  workspace,
}: DashboardScreenProps): ReactElement {
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
        eyebrow="Priority groups"
        title="Groups with live voting"
        description="Use this list to spot which family groups currently have active voting momentum."
      >
        <ul>
          {groupedEvents.map((group) => {
            const liveEvents = group.events.filter((event) => event.status === "collecting");
            return (
              <li key={group.groupId}>
                <strong>{group.groupName}</strong>
                <p>
                  {liveEvents.length > 0
                    ? `${liveEvents.length} live voting event${liveEvents.length === 1 ? "" : "s"} right now.`
                    : "No live voting is active right now."}
                </p>
              </li>
            );
          })}
        </ul>
      </PageSection>
      {groupedEvents.map((group) => (
        <PageSection
          key={group.groupId}
          eyebrow="Group"
          title={group.groupName}
          description="Current voting events for this family group."
        >
          <PrimaryAction label="Open group page" onClick={() => onOpenGroup?.(group.groupId)} />
          <ul>
            {group.events.map((event) => (
              <li key={event.eventId}>
                <button type="button" onClick={() => onOpenEvent?.(event.eventId)}>
                  <strong>{event.eventName}</strong>
                </button>
                <span> {getDashboardEventLabel(event.status)}</span>
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
