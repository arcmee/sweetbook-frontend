import type { ReactElement } from "react";

import {
  getPrototypePhotoWorkflowViewModel,
  type PrototypePhotoWorkflowViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PhotoWorkflowSection } from "./photo-workflow-section";

type EventScreenProps = {
  canManageVoting?: boolean;
  workspace: PrototypeWorkspaceViewModel;
  createPhotoCaption?: string;
  createPhotoFileName?: string;
  isCreatingPhoto?: boolean;
  isLikingPhoto?: boolean;
  onCloseVoting?: () => void | Promise<void>;
  onCreatePhoto?: () => void | Promise<void>;
  onCreatePhotoCaptionChange?: (value: string) => void;
  onCreatePhotoFileChange?: (file: File | null) => void;
  onExtendVoting?: () => void | Promise<void>;
  onLikePhoto?: (photoId: string) => void | Promise<void>;
  selectedEventId?: string;
  selectedGroupName?: string;
  workflow?: PrototypePhotoWorkflowViewModel;
};

export function EventScreen({
  canManageVoting = false,
  workspace,
  createPhotoCaption = "",
  createPhotoFileName,
  isCreatingPhoto = false,
  isLikingPhoto = false,
  onCloseVoting,
  onCreatePhoto,
  onCreatePhotoCaptionChange,
  onCreatePhotoFileChange,
  onExtendVoting,
  onLikePhoto,
  selectedEventId,
  selectedGroupName,
  workflow,
}: EventScreenProps): ReactElement {
  const activeEvent =
    workspace.events.find((event) => event.id === selectedEventId) ?? workspace.events[0];
  const photoWorkflow =
    workflow ?? getPrototypePhotoWorkflowViewModel(activeEvent?.id ?? "");
  const votingPresentation = getVotingPresentation(activeEvent);

  return (
    <>
      <PageSection
        eyebrow="Event page"
        title={activeEvent?.name ?? "Event workspace"}
        description="Members upload event photos here and vote during the active collection window."
      >
        <p>Active group</p>
        <p>{selectedGroupName ?? "No active group"}</p>
        <p>{activeEvent?.description ?? "No event description yet."}</p>
        <p>Voting status badge</p>
        <p>{votingPresentation.badgeLabel}</p>
        <p>
          Voting window:{" "}
          {activeEvent
            ? `${formatVotingDate(activeEvent.votingStartsAt)} -> ${formatVotingDate(
                activeEvent.votingEndsAt,
              )}`
            : "Not scheduled"}
        </p>
        <p>{votingPresentation.supportingText}</p>
        <p>
          {activeEvent?.canVote
            ? "Members can still upload and vote in this event."
            : "Voting is not open for this event right now."}
        </p>
        <p>{activeEvent?.photoCount ?? 0} photos currently belong to this event.</p>
        {canManageVoting ? (
          <>
            <h3>Owner voting controls</h3>
            <p>{votingPresentation.ownerHint}</p>
            <button type="button" onClick={() => void onExtendVoting?.()}>
              Extend voting by 3 days
            </button>
            <button
              type="button"
              onClick={() => void onCloseVoting?.()}
              disabled={activeEvent?.canOwnerSelectPhotos}
            >
              Close voting now
            </button>
          </>
        ) : null}
      </PageSection>
      <PhotoWorkflowSection
        canVote={activeEvent?.canVote ?? false}
        workflow={photoWorkflow}
        createPhotoCaption={createPhotoCaption}
        createPhotoFileName={createPhotoFileName}
        isCreatingPhoto={isCreatingPhoto}
        isLikingPhoto={isLikingPhoto}
        onCreatePhoto={onCreatePhoto}
        onCreatePhotoCaptionChange={onCreatePhotoCaptionChange}
        onCreatePhotoFileChange={onCreatePhotoFileChange}
        onLikePhoto={onLikePhoto}
      />
    </>
  );
}

function formatVotingDate(value?: string): string {
  if (!value) {
    return "Not scheduled";
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

function getVotingPresentation(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
): {
  badgeLabel: string;
  supportingText: string;
  ownerHint: string;
} {
  if (!activeEvent) {
    return {
      badgeLabel: "No event selected",
      supportingText: "Choose an event to view its voting window.",
      ownerHint: "Owner actions appear once an event is selected.",
    };
  }

  if (activeEvent.canOwnerSelectPhotos) {
    return {
      badgeLabel: "Voting closed",
      supportingText: "Owner photo selection is now unlocked for this event.",
      ownerHint: "You can reopen planning by extending the voting window if the group needs more time.",
    };
  }

  if (activeEvent.canVote) {
    const timeLeft = getTimeLeftLabel(activeEvent.votingEndsAt);
    return {
      badgeLabel: timeLeft === "Less than 1 hour left" ? "Voting closing soon" : "Voting in progress",
      supportingText: timeLeft
        ? `Time left to vote: ${timeLeft}.`
        : "Voting is currently active for group members.",
      ownerHint: "You can extend the deadline or close voting once the group is ready for owner selection.",
    };
  }

  return {
    badgeLabel: "Voting not open",
    supportingText: activeEvent.votingStartsAt
      ? `Voting opens on ${formatVotingDate(activeEvent.votingStartsAt)}.`
      : "Set the voting window before members start reacting.",
    ownerHint: "When voting opens, this area will expose the owner deadline controls.",
  };
}

function getTimeLeftLabel(value?: string): string | null {
  if (!value) {
    return null;
  }

  const endsAt = new Date(value);
  if (Number.isNaN(endsAt.valueOf())) {
    return null;
  }

  const diffMs = endsAt.valueOf() - Date.now();
  if (diffMs <= 0) {
    return "Less than 1 hour left";
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) {
    return `${totalHours} hour${totalHours === 1 ? "" : "s"} left`;
  }

  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays} day${totalDays === 1 ? "" : "s"} left`;
}
