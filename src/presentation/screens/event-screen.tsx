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
        <p>Voting status: {activeEvent?.status ?? "draft"}</p>
        <p>
          Voting window:{" "}
          {activeEvent
            ? `${formatVotingDate(activeEvent.votingStartsAt)} -> ${formatVotingDate(
                activeEvent.votingEndsAt,
              )}`
            : "Not scheduled"}
        </p>
        <p>
          {activeEvent?.canVote
            ? "Members can still upload and vote in this event."
            : "Voting is not open for this event right now."}
        </p>
        <p>{activeEvent?.photoCount ?? 0} photos currently belong to this event.</p>
        {canManageVoting ? (
          <>
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
