import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type { PrototypePhotoWorkflowViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type PhotoWorkflowSectionProps = {
  canVote?: boolean;
  createPhotoCaption?: string;
  createPhotoFileName?: string;
  isCreatingPhoto?: boolean;
  isLikingPhoto?: boolean;
  onCreatePhoto?: () => void | Promise<void>;
  onCreatePhotoCaptionChange?: (value: string) => void;
  onCreatePhotoFileChange?: (file: File | null) => void;
  onLikePhoto?: (photoId: string) => void | Promise<void>;
  workflow: PrototypePhotoWorkflowViewModel;
};

export function PhotoWorkflowSection({
  canVote = true,
  createPhotoCaption = "",
  createPhotoFileName,
  isCreatingPhoto = false,
  isLikingPhoto = false,
  onCreatePhoto,
  onCreatePhotoCaptionChange,
  onCreatePhotoFileChange,
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreatePhotoFileChange?.(event.target.files?.[0] ?? null);
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
        <label>
          Photo file
          <input
            accept="image/*"
            name="photoFile"
            type="file"
            onChange={handleFileChange}
          />
        </label>
        <p>{createPhotoFileName ?? "No file selected"}</p>
        <PrimaryAction
          label={isCreatingPhoto ? "Uploading photo..." : "Upload event photo"}
          disabled={
            isCreatingPhoto ||
            createPhotoCaption.trim().length === 0 ||
            !createPhotoFileName
          }
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
            <span> {photo.assetFileName ?? "No uploaded file"}</span>
            {photo.assetUrl ? (
              <div>
                <img
                  alt={`${photo.caption} preview`}
                  src={photo.assetUrl}
                  style={{ maxWidth: "160px" }}
                />
              </div>
            ) : null}
            <PrimaryAction
              label={isLikingPhoto ? "Saving like..." : "Like photo"}
              disabled={isLikingPhoto || photo.likedByViewer || !canVote}
              onClick={() => onLikePhoto?.(photo.id)}
            />
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
