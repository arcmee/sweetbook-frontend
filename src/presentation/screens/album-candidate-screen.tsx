import type { ReactElement } from "react";

import type {
  PrototypeCandidateReviewViewModel,
  PrototypePhotoWorkflowViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type AlbumCandidateScreenProps = {
  activeGroupName?: string;
  activeEventName?: string;
  coverPhotoId?: string;
  onMovePhotoEarlier?: (photoId: string) => void;
  onMovePhotoLater?: (photoId: string) => void;
  onOpenOrder?: () => void;
  onSetCoverPhoto?: (photoId: string) => void;
  selectedPhotoIds?: string[];
  workflow?: PrototypePhotoWorkflowViewModel;
  onTogglePhotoSelection?: (photoId: string) => void;
  workspace: PrototypeWorkspaceViewModel;
  review?: PrototypeCandidateReviewViewModel;
};

export function AlbumCandidateScreen({
  activeGroupName,
  activeEventName,
  coverPhotoId,
  onMovePhotoEarlier,
  onMovePhotoLater,
  onOpenOrder,
  onSetCoverPhoto,
  selectedPhotoIds = [],
  workflow,
  onTogglePhotoSelection,
  workspace,
  review,
}: AlbumCandidateScreenProps): ReactElement {
  const activeEvent = workspace.events[0];
  const activeReview = review ?? {
    activeEventId: activeEvent?.id ?? "",
    activeEventName: activeEvent?.name ?? "No active event",
    candidates: [],
    pagePreview: [],
  };
  const availablePhotos = workflow?.photos ?? [];
  const effectiveSelectedPhotoIds =
    selectedPhotoIds.length > 0
      ? selectedPhotoIds
      : activeReview.candidates.map((candidate) => candidate.photoId);
  const selectedPhotos = availablePhotos.filter((photo) =>
    effectiveSelectedPhotoIds.includes(photo.id),
  );
  const coverPhoto =
    selectedPhotos.find((photo) => photo.id === coverPhotoId) ?? selectedPhotos[0];
  const layoutPhotos = selectedPhotos.filter((photo) => photo.id !== coverPhoto?.id);
  const previewPages =
    selectedPhotos.length > 0
      ? buildPreviewPages(coverPhoto, layoutPhotos)
      : activeReview.pagePreview;

  return (
    <>
      <PageSection
        eyebrow="Owner selection"
        title="Build the album draft"
        description="Simulate the SweetBook book-building flow by curating the cover, spreads, and final shortlist before checkout."
      >
        <p>Current group: {activeGroupName ?? "No active group"}</p>
        <p>Current event: {activeEventName ?? activeReview.activeEventName}</p>
        <p>{selectedPhotos.length} owner-approved photos are queued for this book draft.</p>
        <PrimaryAction
          label="Continue to order setup"
          onClick={onOpenOrder}
          disabled={selectedPhotos.length === 0}
        />
      </PageSection>

      <PageSection
        eyebrow="Book structure"
        title="SweetBook-style planning surface"
        description="Lock the cover candidate first, then confirm the rest of the spread order."
      >
        <div>
          <h3>Cover candidate</h3>
          {coverPhoto ? (
            <div>
              <strong>{coverPhoto.caption}</strong>
              <p>
                {coverPhoto.likeCount} likes, uploaded by {coverPhoto.uploadedBy}
              </p>
              <p>This photo will lead the album cover unless you remove it below.</p>
            </div>
          ) : (
            <p>Select at least one photo to create a cover candidate.</p>
          )}
        </div>
        <div>
          <h3>Story spread queue</h3>
          {layoutPhotos.length > 0 ? (
            <ol>
              {layoutPhotos.map((photo) => (
                <li key={photo.id}>
                  <strong>{photo.caption}</strong>
                  <span> {photo.likeCount} likes</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>Add more photos to build the inside spreads.</p>
          )}
        </div>
        <div>
          <h3>Prototype page preview</h3>
          <ul>
            {previewPages.map((page) => (
              <li key={page.pageNumber}>
                <strong>{page.title}</strong>
                <span> Page {page.pageNumber}</span>
                <p>{page.photoCaptions.join(", ")}</p>
              </li>
            ))}
          </ul>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Selection tray"
        title="Choose photos for the book"
        description="Likes are recommendation signals. The owner makes the final decision here."
      >
        <ul>
          {availablePhotos.map((photo) => {
            const isSelected = effectiveSelectedPhotoIds.includes(photo.id);
            const candidate = activeReview.candidates.find(
              (item) => item.photoId === photo.id,
            );

            return (
              <li key={photo.id}>
                <strong>{photo.caption}</strong>
                <span> {photo.likeCount} likes</span>
                <span> Uploaded by {photo.uploadedBy}</span>
                {coverPhoto?.id === photo.id ? <p>Current cover selection.</p> : null}
                {isSelected && coverPhoto?.id !== photo.id ? (
                  <p>
                    Spread position {layoutPhotos.findIndex((item) => item.id === photo.id) + 1}
                  </p>
                ) : null}
                {candidate ? <p>{candidate.whySelected}</p> : <p>No current recommendation note.</p>}
                {isSelected ? (
                  <PrimaryAction
                    label={coverPhoto?.id === photo.id ? "Cover locked" : "Use as cover"}
                    onClick={() => onSetCoverPhoto?.(photo.id)}
                    disabled={coverPhoto?.id === photo.id}
                  />
                ) : null}
                {isSelected && coverPhoto?.id !== photo.id ? (
                  <PrimaryAction
                    label="Move earlier"
                    onClick={() => onMovePhotoEarlier?.(photo.id)}
                    disabled={layoutPhotos.findIndex((item) => item.id === photo.id) <= 0}
                  />
                ) : null}
                {isSelected && coverPhoto?.id !== photo.id ? (
                  <PrimaryAction
                    label="Move later"
                    onClick={() => onMovePhotoLater?.(photo.id)}
                    disabled={
                      layoutPhotos.findIndex((item) => item.id === photo.id) ===
                      layoutPhotos.length - 1
                    }
                  />
                ) : null}
                <PrimaryAction
                  label={isSelected ? "Remove from book" : "Select for book"}
                  onClick={() => onTogglePhotoSelection?.(photo.id)}
                />
              </li>
            );
          })}
        </ul>
      </PageSection>
    </>
  );
}

function buildPreviewPages(
  coverPhoto:
    | PrototypePhotoWorkflowViewModel["photos"][number]
    | undefined,
  layoutPhotos: PrototypePhotoWorkflowViewModel["photos"],
): Array<{
  pageNumber: number;
  title: string;
  photoCaptions: string[];
}> {
  const pages: Array<{ pageNumber: number; title: string; photoCaptions: string[] }> = [];

  if (coverPhoto) {
    pages.push({
      pageNumber: 1,
      title: "Cover preview",
      photoCaptions: [coverPhoto.caption],
    });
  }

  for (let index = 0; index < layoutPhotos.length; index += 2) {
    const spreadPhotos = layoutPhotos.slice(index, index + 2);
    pages.push({
      pageNumber: pages.length + 1,
      title: `Spread ${pages.length}`,
      photoCaptions: spreadPhotos.map((photo) => photo.caption),
    });
  }

  return pages;
}
