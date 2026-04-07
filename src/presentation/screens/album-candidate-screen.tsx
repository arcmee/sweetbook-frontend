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
  isOwnerApproved?: boolean;
  openedFromOwnerReview?: boolean;
  onMovePhotoEarlier?: (photoId: string) => void;
  onMovePhotoLater?: (photoId: string) => void;
  onOpenOrder?: () => void;
  onToggleOwnerApproval?: () => void;
  onSetPageLayout?: (pageId: string, layout: string) => void;
  onSetPageNote?: (pageId: string, note: string) => void;
  onSetCoverPhoto?: (photoId: string) => void;
  pageLayouts?: Record<string, string>;
  pageNotes?: Record<string, string>;
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
  isOwnerApproved = false,
  openedFromOwnerReview = false,
  onMovePhotoEarlier,
  onMovePhotoLater,
  onOpenOrder,
  onToggleOwnerApproval,
  onSetPageLayout,
  onSetPageNote,
  onSetCoverPhoto,
  pageLayouts = {},
  pageNotes = {},
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
      ? buildPreviewPages(coverPhoto, layoutPhotos, pageLayouts, pageNotes)
      : activeReview.pagePreview;
  const readyPageCount = previewPages.filter((page) => page.status === "Ready").length;
  const reviewPageCount = previewPages.filter(
    (page) => page.status === "Needs review",
  ).length;
  const canOpenOrder =
    selectedPhotos.length > 0 && reviewPageCount === 0 && isOwnerApproved;
  const pendingChecks = previewPages
    .filter((page) => page.warning)
    .map((page) => `${page.title}: ${page.warning}`);
  const nextBlocker =
    !coverPhoto
      ? "Choose a cover photo before handoff."
      : selectedPhotos.length < 3
        ? "Approve at least 3 photos for the draft."
        : reviewPageCount > 0
          ? pendingChecks[0] ?? "Resolve the flagged draft pages."
          : !isOwnerApproved
            ? "Record owner approval for the draft."
            : null;
  const handoffChecklist = [
    {
      label: "Choose a cover photo",
      done: Boolean(coverPhoto),
    },
    {
      label: "Approve at least 3 photos for the draft",
      done: selectedPhotos.length >= 3,
    },
    {
      label: "Resolve all draft page warnings",
      done: reviewPageCount === 0,
    },
    {
      label: "Record owner approval for the draft",
      done: isOwnerApproved,
    },
  ];
  const handoffStatus = canOpenOrder ? "Ready for SweetBook handoff" : "Blocked";

  return (
    <>
      <PageSection
        eyebrow="Owner selection"
        title="Build the album draft"
        description="Simulate the SweetBook book-building flow by curating the cover, spreads, and final shortlist before checkout."
      >
        <p>Current group: {activeGroupName ?? "No active group"}</p>
        <p>Current event: {activeEventName ?? activeReview.activeEventName}</p>
        {openedFromOwnerReview ? (
          <div>
            <h3>Owner review goals</h3>
            <p>Opened from the owner review queue.</p>
            <p>Voting is finished. Finalize the draft here before opening the SweetBook handoff.</p>
            <ul>
              <li>{coverPhoto ? "Done" : "Pending"}: Lock a cover image for this event.</li>
              <li>
                {reviewPageCount === 0 ? "Done" : "Pending"}: Clear every draft page warning before handoff.
              </li>
              <li>
                {isOwnerApproved ? "Done" : "Pending"}: Record the final owner approval for SweetBook.
              </li>
            </ul>
          </div>
        ) : null}
        <p>{selectedPhotos.length} owner-approved photos are queued for this book draft.</p>
        <p>Draft readiness: {readyPageCount} ready, {reviewPageCount} need review.</p>
        <p>
          Next blocker:{" "}
          {nextBlocker ?? "No blockers remain. The draft can move to SweetBook handoff."}
        </p>
        <div>
          <h3>Owner handoff checklist</h3>
          <ul>
            {handoffChecklist.map((item) => (
              <li key={item.label}>
                {item.done ? "Done" : "Pending"}: {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Owner approval</h3>
          <p>
            {isOwnerApproved
              ? "Owner approval recorded. This draft can move into SweetBook order setup."
              : "The group owner still needs to approve this draft before handoff."}
          </p>
          <PrimaryAction
            label={isOwnerApproved ? "Withdraw owner approval" : "Approve this draft"}
            onClick={onToggleOwnerApproval}
          />
        </div>
        <div>
          <h3>SweetBook handoff summary</h3>
          <p>Status: {handoffStatus}</p>
          <p>Cover payload: {coverPhoto?.caption ?? "No cover selected yet."}</p>
          <p>Spread payload count: {layoutPhotos.length}</p>
          <p>Draft page payload count: {previewPages.length}</p>
        </div>
        {reviewPageCount > 0 ? (
          <>
            <p>Resolve the flagged pages before opening the SweetBook order handoff.</p>
            <ul>
              {pendingChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            {isOwnerApproved
              ? "All pages are ready. You can continue to the SweetBook handoff."
              : "All pages are ready. Record owner approval to continue to SweetBook handoff."}
          </p>
        )}
        <PrimaryAction
          label="Continue to order setup"
          onClick={onOpenOrder}
          disabled={!canOpenOrder}
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
              <li key={"pageId" in page ? page.pageId : page.pageNumber}>
                {"status" in page ? <p>Status: {page.status}</p> : null}
                <strong>{page.title}</strong>
                <span> Page {page.pageNumber}</span>
                {"layout" in page ? <p>Layout: {page.layout}</p> : null}
                {"editNote" in page ? <p>{page.editNote}</p> : null}
                {"warning" in page && page.warning ? <p>Warning: {page.warning}</p> : null}
                {"pageId" in page ? (
                  <div>
                    <label>
                      Page layout
                      <select
                        value={page.layout}
                        onChange={(event) => onSetPageLayout?.(page.pageId, event.target.value)}
                      >
                        {getLayoutOptions(page.pageId === "cover").map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Edit note
                      <input
                        value={page.editNote}
                        onChange={(event) => onSetPageNote?.(page.pageId, event.target.value)}
                      />
                    </label>
                    {"recommendedLayout" in page && page.recommendedLayout !== page.layout ? (
                      <PrimaryAction
                        label="Use recommended layout"
                        onClick={() => onSetPageLayout?.(page.pageId, page.recommendedLayout)}
                      />
                    ) : null}
                    {"recommendedNote" in page &&
                    page.recommendedNote !== page.editNote ? (
                      <PrimaryAction
                        label="Restore suggested note"
                        onClick={() => onSetPageNote?.(page.pageId, page.recommendedNote)}
                      />
                    ) : null}
                  </div>
                ) : null}
                <p>{page.photoCaptions.length} photo slot{page.photoCaptions.length === 1 ? "" : "s"} planned</p>
                {"photoIds" in page ? (
                  <ul>
                    {page.photoCaptions.map((caption, index) => {
                      const photoId = page.photoIds[index];
                      const spreadIndex = layoutPhotos.findIndex((photo) => photo.id === photoId);
                      const canMoveEarlier = spreadIndex > 0;
                      const canMoveLater =
                        spreadIndex > -1 && spreadIndex < layoutPhotos.length - 1;

                      return (
                        <li key={photoId}>
                          <span>{caption}</span>
                          <PrimaryAction
                            label="Move to previous page"
                            onClick={() => onMovePhotoEarlier?.(photoId)}
                            disabled={!canMoveEarlier}
                          />
                          <PrimaryAction
                            label="Move to next page"
                            onClick={() => onMovePhotoLater?.(photoId)}
                            disabled={!canMoveLater}
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p>{page.photoCaptions.join(", ")}</p>
                )}
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
  pageLayouts: Record<string, string>,
  pageNotes: Record<string, string>,
): Array<{
  editNote: string;
  layout: string;
  pageId: string;
  pageNumber: number;
  photoIds: string[];
  recommendedLayout: string;
  recommendedNote: string;
  status: string;
  title: string;
  warning: string | null;
  photoCaptions: string[];
}> {
  const pages: Array<{
    editNote: string;
    layout: string;
    pageId: string;
    pageNumber: number;
    photoIds: string[];
    recommendedLayout: string;
    recommendedNote: string;
    status: string;
    title: string;
    warning: string | null;
    photoCaptions: string[];
  }> = [];

  if (coverPhoto) {
    const pageId = "cover";
    const recommendedLayout = "Full-bleed cover";
    const recommendedNote =
      "Lead with the strongest event-defining moment on the cover.";
    const layout = pageLayouts[pageId] ?? recommendedLayout;
    const editNote = pageNotes[pageId] ?? recommendedNote;
    pages.push({
      editNote,
      layout,
      pageId,
      pageNumber: 1,
      photoIds: [coverPhoto.id],
      recommendedLayout,
      recommendedNote,
      status: "Ready",
      title: "Cover preview",
      warning: editNote.trim().length === 0 ? "Add a cover note before handoff." : null,
      photoCaptions: [coverPhoto.caption],
    });
  }

  for (let index = 0; index < layoutPhotos.length; index += 2) {
    const spreadPhotos = layoutPhotos.slice(index, index + 2);
    const spreadNumber = index / 2 + 1;
    const pageId = `spread-${spreadNumber}`;
    const recommendedLayout = getDefaultSpreadLayout(spreadPhotos.length);
    const recommendedNote =
      spreadPhotos.length > 1
        ? "Use this spread to balance detail shots with group moments."
        : "Single-photo spread can spotlight a key memory beat.";
    const layout = pageLayouts[pageId] ?? recommendedLayout;
    const editNote = pageNotes[pageId] ?? recommendedNote;
    const warning = getPageWarning(layout, spreadPhotos.length, editNote);
    pages.push({
      editNote,
      layout,
      pageId,
      pageNumber: pages.length + 1,
      photoIds: spreadPhotos.map((photo) => photo.id),
      recommendedLayout,
      recommendedNote,
      status: warning ? "Needs review" : "Ready",
      title: `Spread ${pages.length}`,
      warning,
      photoCaptions: spreadPhotos.map((photo) => photo.caption),
    });
  }

  return pages;
}

function getDefaultSpreadLayout(photoCount: number): string {
  return photoCount > 1 ? "Balanced two-photo spread" : "Single-photo spotlight";
}

function getLayoutOptions(isCover: boolean): string[] {
  return isCover
    ? ["Full-bleed cover", "Centered portrait cover", "Title-first cover"]
    : [
        "Balanced two-photo spread",
        "Single-photo spotlight",
        "Collage spread",
        "Caption-led story spread",
      ];
}

function getPageWarning(
  layout: string,
  photoCount: number,
  editNote: string,
): string | null {
  if (editNote.trim().length === 0) {
    return "Add an edit note before sending this page to SweetBook.";
  }

  if (layout === "Single-photo spotlight" && photoCount > 1) {
    return "Single-photo spotlight works best with one photo.";
  }

  if (layout === "Balanced two-photo spread" && photoCount < 2) {
    return "Balanced two-photo spread needs two photos to feel complete.";
  }

  if (layout === "Collage spread" && photoCount < 2) {
    return "Collage spread needs at least two photos.";
  }

  return null;
}
