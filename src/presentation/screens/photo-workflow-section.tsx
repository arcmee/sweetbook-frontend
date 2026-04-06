import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { PrototypePhotoWorkflowViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type PhotoWorkflowSectionProps = {
  createPhotoCaption?: string;
  isCreatingPhoto?: boolean;
  isLikingPhoto?: boolean;
  onCreatePhoto?: () => void | Promise<void>;
  onCreatePhotoCaptionChange?: (value: string) => void;
  onLikePhoto?: (photoId: string) => void | Promise<void>;
  workflow: PrototypePhotoWorkflowViewModel;
};

export function PhotoWorkflowSection({
  createPhotoCaption = "",
  isCreatingPhoto = false,
  isLikingPhoto = false,
  onCreatePhoto,
  onCreatePhotoCaptionChange,
  onLikePhoto,
  workflow,
}: PhotoWorkflowSectionProps): ReactElement {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreatePhoto?.();
  }

  function handleCaptionChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreatePhotoCaptionChange?.(event.target.value);
  }

  return (
    <PageSection
      eyebrow="Photo workflow"
      title="Upload photos"
      description="Choose favorites before candidate review begins."
    >
      <form onSubmit={handleSubmit}>
        <label>
          New photo caption
          <input
            name="photoCaption"
            value={createPhotoCaption}
            onChange={handleCaptionChange}
          />
        </label>
        <PrimaryAction
          label={isCreatingPhoto ? "Adding event photo..." : "Add event photos"}
          disabled={isCreatingPhoto || createPhotoCaption.trim().length === 0}
          type="submit"
        />
      </form>
      <p>{workflow.uploadState.pendingCount} pending uploads</p>
      <p>{workflow.uploadState.uploadedCount} already in the event</p>
      <p>{workflow.uploadState.helperText}</p>
      <h3>Like feedback</h3>
      <ul>
        {workflow.photos.map((photo) => (
          <li key={photo.id}>
            <strong>{photo.caption}</strong>
            <span> {photo.uploadedBy}</span>
            <span> {photo.likeCount} likes</span>
            <span> {photo.likedByViewer ? "Liked by you" : "Not liked yet"}</span>
            <PrimaryAction
              label={isLikingPhoto ? "Saving like..." : "Like photo"}
              disabled={isLikingPhoto || photo.likedByViewer}
              onClick={() => onLikePhoto?.(photo.id)}
            />
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
