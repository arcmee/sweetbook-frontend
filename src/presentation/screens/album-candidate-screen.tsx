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
  const pageCards = activeReview.pagePreview.map((page, index) => ({
    ...page,
    layoutLabel: index === 0 ? "Full-bleed cover" : page.photoCaptions.length > 1 ? "Two-photo spread" : "Single-photo focus",
    editNote:
      index === 0
        ? "Lead with the strongest milestone image."
        : page.photoCaptions.length > 1
          ? "Balance these two photos across the spread."
          : "Use this page as a quiet transition beat.",
  }));

  return (
    <>
      <PageSection
        eyebrow="Candidate review"
        title="Album candidate review"
        description="Review the draft spread like a lightweight book editor before entering the order flow."
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
        title="Prototype page planner"
        description="Inspect each draft page card, layout hint, and edit note before handing off the order."
      >
        <ul>
          {pageCards.map((page) => (
            <li key={page.pageNumber}>
              <strong>{page.title}</strong>
              <span> Page {page.pageNumber}</span>
              <p>Layout: {page.layoutLabel}</p>
              <p>{page.photoCaptions.join(", ")}</p>
              <p>{page.editNote}</p>
            </li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}
