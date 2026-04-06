import type { ReactElement } from "react";

import {
  getPrototypeCandidateReviewViewModel,
  type PrototypeCandidateReviewViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type AlbumCandidateScreenProps = {
  activeGroupName?: string;
  activeEventName?: string;
  workspace: PrototypeWorkspaceViewModel;
  review?: PrototypeCandidateReviewViewModel;
};

export function AlbumCandidateScreen({
  activeGroupName,
  activeEventName,
  workspace,
  review,
}: AlbumCandidateScreenProps): ReactElement {
  const activeEvent = workspace.events[0];
  const activeReview =
    review ?? getPrototypeCandidateReviewViewModel(activeEvent?.id ?? "");

  return (
    <>
      <PageSection
        eyebrow="Candidate review"
        title="Album candidate review"
        description="Review the draft spread before entering the order flow."
      >
        <p>Current group: {activeGroupName ?? "No active group"}</p>
        <p>Current event: {activeEventName ?? activeReview.activeEventName}</p>
        <PrimaryAction label="Refresh candidate set" />
        <p>Top picks for {activeReview.activeEventName}</p>
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
        eyebrow="Page preview"
        title="Page preview"
        description="Inspect how the prototype candidate set maps to early album pages."
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
