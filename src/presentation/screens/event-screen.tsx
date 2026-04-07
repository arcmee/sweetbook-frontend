import type { ReactElement } from "react";

import {
  getPrototypePhotoWorkflowViewModel,
  type PrototypePhotoWorkflowViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { StatePanel } from "../ui/state-panel";
import { PhotoWorkflowSection } from "./photo-workflow-section";

type EventSubmittedOrderSummary = {
  bookUid: string;
  orderStatusDisplay?: string | null;
  orderUid: string;
};

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
  submittedOrder?: EventSubmittedOrderSummary;
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
  submittedOrder,
  workflow,
}: EventScreenProps): ReactElement {
  const activeEvent =
    workspace.events.find((event) => event.id === selectedEventId) ?? workspace.events[0];
  const photoWorkflow =
    workflow ?? getPrototypePhotoWorkflowViewModel(activeEvent?.id ?? "");
  const votingPresentation = getVotingPresentation(activeEvent);
  const lifecycleSummary = getLifecycleSummary(activeEvent);

  return (
    <>
      <PageSection
        eyebrow="Event page"
        title={activeEvent?.name ?? "Event workspace"}
        description="Members upload event photos here and vote during the active collection window."
      >
        {submittedOrder ? (
          <>
            <StatePanel
              tone="success"
              title="SweetBook operation already completed"
              description={`Order ${submittedOrder.orderUid} was submitted for book ${submittedOrder.bookUid}${submittedOrder.orderStatusDisplay ? ` (${submittedOrder.orderStatusDisplay})` : ""}.`}
            />
            <div>
              <h3>Completed SweetBook operation</h3>
              <p>Book draft: {submittedOrder.bookUid}</p>
              <p>Order reference: {submittedOrder.orderUid}</p>
              <p>
                Final order state: {submittedOrder.orderStatusDisplay ?? "Submitted"}
              </p>
              <p>
                This event has already completed its SweetBook handoff. You can reopen the event to
                review the final voting context and uploaded photos.
              </p>
            </div>
          </>
        ) : null}
          <p>Active group</p>
          <p>{selectedGroupName ?? "No active group"}</p>
        <p>{activeEvent?.description ?? "No event description yet."}</p>
        <div>
          <h3>SweetBook operation</h3>
          <p>{getSweetBookOperationHeadline(activeEvent, submittedOrder)}</p>
          <p>{getSweetBookOperationHint(activeEvent, submittedOrder)}</p>
        </div>
          <p>Lifecycle phase</p>
          <p>{lifecycleSummary.phaseLabel}</p>
          <p>{lifecycleSummary.nextStep}</p>
          <p>{votingPresentation.headline}</p>
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
            <p>{votingPresentation.ownerActionState}</p>
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
  headline: string;
  supportingText: string;
  ownerHint: string;
  ownerActionState: string;
} {
  if (!activeEvent) {
    return {
      badgeLabel: "No event selected",
      headline: "Choose an event to manage voting",
      supportingText: "Choose an event to view its voting window.",
      ownerHint: "Owner actions appear once an event is selected.",
      ownerActionState: "No owner actions are available until an event is selected.",
    };
  }

  if (activeEvent.canOwnerSelectPhotos) {
    return {
      badgeLabel: "Voting closed",
      headline: "Selection unlocked for the group owner",
      supportingText: "Owner photo selection is now unlocked for this event.",
      ownerHint: "You can reopen planning by extending the voting window if the group needs more time.",
      ownerActionState: "Voting has ended. You can move into owner selection or reopen the deadline.",
    };
  }

  if (activeEvent.canVote) {
    const timeLeft = getTimeLeftLabel(activeEvent.votingEndsAt);
    return {
      badgeLabel: timeLeft === "Less than 1 hour left" ? "Voting closing soon" : "Voting in progress",
      headline:
        timeLeft === "Less than 1 hour left"
          ? "Voting closes soon for this event"
          : "Voting is currently open for this event",
      supportingText: timeLeft
        ? `Time left to vote: ${timeLeft}.`
        : "Voting is currently active for group members.",
      ownerHint: "You can extend the deadline or close voting once the group is ready for owner selection.",
      ownerActionState: "Owner controls are active while voting is still running.",
    };
  }

  return {
    badgeLabel: "Voting not open",
    headline: "Voting opens soon for this event",
    supportingText: activeEvent.votingStartsAt
      ? `Voting opens on ${formatVotingDate(activeEvent.votingStartsAt)}.`
      : "Set the voting window before members start reacting.",
    ownerHint: "When voting opens, this area will expose the owner deadline controls.",
    ownerActionState: "Owner controls are waiting for the voting window to open.",
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

function getLifecycleSummary(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
): {
  phaseLabel: string;
  nextStep: string;
} {
  if (!activeEvent) {
    return {
      phaseLabel: "No lifecycle available",
      nextStep: "Choose an event to review its current stage.",
    };
  }

  if (activeEvent.status === "draft") {
    return {
      phaseLabel: "Setup",
      nextStep: "Open the voting window so members can start uploading and reacting.",
    };
  }

  if (activeEvent.status === "collecting") {
    return {
      phaseLabel: "Voting live",
      nextStep: "Collect likes until the deadline, then move into owner selection.",
    };
  }

  return {
    phaseLabel: "Owner review",
    nextStep: "The owner can now finalize the photo set and continue to SweetBook handoff.",
  };
}

function getSweetBookOperationHeadline(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
  submittedOrder: EventSubmittedOrderSummary | undefined,
): string {
  if (submittedOrder) {
    return "SweetBook operation completed for this event.";
  }

  if (!activeEvent) {
    return "Choose an event to inspect its SweetBook flow.";
  }

  if (activeEvent.canOwnerSelectPhotos) {
    return "This event is waiting for owner review and SweetBook handoff.";
  }

  if (activeEvent.canVote) {
    return "This event is still collecting votes before owner review opens.";
  }

  return "This event is still in setup before SweetBook planning can begin.";
}

function getSweetBookOperationHint(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
  submittedOrder: EventSubmittedOrderSummary | undefined,
): string {
  if (submittedOrder) {
    return `Order ${submittedOrder.orderUid} is already archived for this event.`;
  }

  if (!activeEvent) {
    return "Select an event to see its current flow into owner review and SweetBook handoff.";
  }

  if (activeEvent.canOwnerSelectPhotos) {
    return "Open the owner review flow to finalize the draft and continue into SweetBook handoff.";
  }

  if (activeEvent.canVote) {
    return "Keep collecting uploads and likes until the voting window closes.";
  }

  return "Open voting first, then collect reactions before SweetBook handoff can move forward.";
}
