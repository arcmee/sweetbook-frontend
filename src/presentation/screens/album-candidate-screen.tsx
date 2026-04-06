import type { ReactElement } from "react";

import {
  getPrototypeCandidateReviewViewModel,
  type PrototypePhotoWorkflowViewModel,
  type PrototypeCandidateReviewViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type AlbumCandidateScreenProps = {
  activeGroupName?: string;
  activeEventName?: string;
  selectedPhotoIds?: string[];
  workflow?: PrototypePhotoWorkflowViewModel;
  onTogglePhotoSelection?: (photoId: string) => void;
  workspace: PrototypeWorkspaceViewModel;
  review?: PrototypeCandidateReviewViewModel;
};

export function AlbumCandidateScreen({
  activeGroupName,
  activeEventName,
  selectedPhotoIds = [],
  workflow,
  onTogglePhotoSelection,
  workspace,
  review,
}: AlbumCandidateScreenProps): ReactElement {
  const activeEvent = workspace.events[0];
  const activeReview =
    review ?? getPrototypeCandidateReviewViewModel(activeEvent?.id ?? "");
  const selectablePhotos = workflow?.photos ?? [];

  return (
    <>
      <PageSection
        eyebrow="Owner selection"
        title="Select album photos"
        description="Likes surface priority, but the group owner makes the final album picks."
      >
        <p>Current group: {activeGroupName ?? "No active group"}</p>
        <p>Current event: {activeEventName ?? activeReview.activeEventName}</p>
        <p>{selectedPhotoIds.length} owner-approved photos selected</p>
        <p>Priority hints for {activeReview.activeEventName}</p>
        <ul>
          {activeReview.candidates.map((candidate) => (
            <li key={candidate.photoId}>
              <strong>Rank {candidate.rank}</strong>
              <span> {candidate.caption}</span>
              <span> {candidate.likeCount} likes</span>
              <p>{candidate.whySelected}</p>
            </li>
          ))}
        </ul>
      </PageSection>
      <PageSection
        eyebrow="Final picks"
        title="Owner-approved selection"
        description="Choose the actual photos that should flow into the SweetBook handoff."
      >
        <ul>
          {selectablePhotos.map((photo) => {
            const isSelected = selectedPhotoIds.includes(photo.id);

            return (
              <li key={photo.id}>
                <strong>{photo.caption}</strong>
                <span> {photo.likeCount} likes</span>
                <span> {isSelected ? " Selected by owner" : " Not selected yet"}</span>
                <PrimaryAction
                  label={isSelected ? "Remove from album" : "Select for album"}
                  onClick={() => onTogglePhotoSelection?.(photo.id)}
                />
              </li>
            );
          })}
        </ul>
      </PageSection>
      <PageSection
        eyebrow="Page preview"
        title="Page preview"
        description="Inspect how the current selection maps to early album pages."
      >
        <ul>
          {activeReview.pagePreview.map((page) => (
            <li key={page.pageNumber}>
              <strong>{page.title}</strong>
              <span> Page {page.pageNumber}</span>
              <p>{page.photoCaptions.join(", ")}</p>
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}
