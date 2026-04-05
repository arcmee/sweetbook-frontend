import type { ReactElement } from "react";

import type { PrototypePhotoWorkflowViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type PhotoWorkflowSectionProps = {
  workflow: PrototypePhotoWorkflowViewModel;
};

export function PhotoWorkflowSection({
  workflow,
}: PhotoWorkflowSectionProps): ReactElement {
  return (
    <PageSection
      eyebrow="Photo workflow"
      title="Upload photos"
      description="Choose favorites before candidate review begins."
    >
      <PrimaryAction label="Add event photos" />
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
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
