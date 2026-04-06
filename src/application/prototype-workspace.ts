import type {
  CandidateReviewSnapshot,
  OrderEntrySnapshot,
  PhotoWorkflowSnapshot,
  PrototypeWorkspaceSnapshot,
  WorkspaceSnapshot,
} from "./prototype-workspace-snapshot";

export type GroupCardViewModel = WorkspaceSnapshot["groups"][number];
export type EventCardViewModel = WorkspaceSnapshot["events"][number];
export type PrototypeWorkspaceViewModel = WorkspaceSnapshot;
export type PhotoCardViewModel = PhotoWorkflowSnapshot["photos"][number];
export type PrototypePhotoWorkflowViewModel = PhotoWorkflowSnapshot;
export type CandidateCardViewModel = CandidateReviewSnapshot["candidates"][number];
export type PagePreviewViewModel = CandidateReviewSnapshot["pagePreview"][number];
export type PrototypeCandidateReviewViewModel = CandidateReviewSnapshot;
export type PrototypeOrderEntryViewModel = OrderEntrySnapshot;

const defaultPrototypeWorkspaceSnapshot: PrototypeWorkspaceSnapshot = {
  workspace: {
    groupSummary: {
      totalGroups: 2,
      totalMembers: 7,
    },
    groups: [
      {
        id: "group-han",
        name: "Han family",
        memberCount: 4,
        role: "Owner",
        eventCount: 2,
      },
      {
        id: "group-park",
        name: "Park cousins",
        memberCount: 3,
        role: "Editor",
        eventCount: 1,
      },
    ],
    events: [
      {
        id: "event-birthday",
        name: "First birthday album",
        groupName: "Han family",
        status: "collecting",
        photoCount: 124,
      },
      {
        id: "event-holiday",
        name: "Winter holiday trip",
        groupName: "Park cousins",
        status: "draft",
        photoCount: 36,
      },
    ],
  },
  photoWorkflows: [
    {
      activeEventId: "event-birthday",
      activeEventName: "First birthday album",
      uploadState: {
        pendingCount: 3,
        uploadedCount: 124,
        helperText: "Upload queue is local-only until backend adapters land.",
      },
      photos: [
        {
          id: "photo-cake",
          caption: "Cake table setup",
          uploadedBy: "Mina",
          likeCount: 12,
          likedByViewer: true,
        },
        {
          id: "photo-family",
          caption: "Family portrait",
          uploadedBy: "Joon",
          likeCount: 9,
          likedByViewer: false,
        },
        {
          id: "photo-gift",
          caption: "Gift opening moment",
          uploadedBy: "Ara",
          likeCount: 7,
          likedByViewer: true,
        },
      ],
    },
    {
      activeEventId: "event-holiday",
      activeEventName: "Winter holiday trip",
      uploadState: {
        pendingCount: 1,
        uploadedCount: 36,
        helperText: "Upload queue is local-only until backend adapters land.",
      },
      photos: [
        {
          id: "photo-cabin",
          caption: "Cabin arrival",
          uploadedBy: "Soo",
          likeCount: 4,
          likedByViewer: false,
        },
      ],
    },
  ],
  candidateReviews: [
    {
      activeEventId: "event-birthday",
      activeEventName: "First birthday album",
      candidates: [
        {
          photoId: "photo-cake",
          caption: "Cake table setup",
          rank: 1,
          likeCount: 12,
          whySelected:
            "Selected because this photo combines strong likes with a clear milestone moment.",
        },
        {
          photoId: "photo-family",
          caption: "Family portrait",
          rank: 2,
          likeCount: 9,
          whySelected:
            "Selected because this photo balances group coverage with strong likes.",
        },
        {
          photoId: "photo-gift",
          caption: "Gift opening moment",
          rank: 3,
          likeCount: 7,
          whySelected:
            "Selected because this photo adds emotional variety to the album story.",
        },
      ],
      pagePreview: [
        {
          pageNumber: 1,
          title: "Cover preview",
          photoCaptions: ["Cake table setup"],
        },
        {
          pageNumber: 2,
          title: "Family spread",
          photoCaptions: ["Family portrait", "Gift opening moment"],
        },
      ],
    },
  ],
  orderEntries: [
    {
      activeEventId: "event-birthday",
      activeEventName: "First birthday album",
      selectedCandidateCount: 3,
      handoffSummary: {
        bookFormat: "Hardcover square",
        payloadSections: ["selected photos", "page preview", "event title"],
        note: "Review this summary before backend submission is wired.",
      },
    },
  ],
};

export function getDefaultPrototypeWorkspaceSnapshot(): PrototypeWorkspaceSnapshot {
  return defaultPrototypeWorkspaceSnapshot;
}

export function getPrototypeWorkspaceViewModel(
  snapshot: PrototypeWorkspaceSnapshot = defaultPrototypeWorkspaceSnapshot,
): PrototypeWorkspaceViewModel {
  return snapshot.workspace;
}

export function getPrototypePhotoWorkflowViewModel(
  eventId: string,
  snapshot: PrototypeWorkspaceSnapshot = defaultPrototypeWorkspaceSnapshot,
): PrototypePhotoWorkflowViewModel {
  const workflow = snapshot.photoWorkflows.find(
    (item) => item.activeEventId === eventId,
  );

  if (!workflow) {
    throw new Error(`Unknown photo workflow event: ${eventId}`);
  }

  return workflow;
}

export function getPrototypeCandidateReviewViewModel(
  eventId: string,
  snapshot: PrototypeWorkspaceSnapshot = defaultPrototypeWorkspaceSnapshot,
): PrototypeCandidateReviewViewModel {
  const review = snapshot.candidateReviews.find(
    (item) => item.activeEventId === eventId,
  );

  if (!review) {
    throw new Error(`Unknown candidate review event: ${eventId}`);
  }

  return review;
}

export function getPrototypeOrderEntryViewModel(
  eventId: string,
  snapshot: PrototypeWorkspaceSnapshot = defaultPrototypeWorkspaceSnapshot,
): PrototypeOrderEntryViewModel {
  const orderEntry = snapshot.orderEntries.find(
    (item) => item.activeEventId === eventId,
  );

  if (!orderEntry) {
    throw new Error(`Unknown order entry event: ${eventId}`);
  }

  return orderEntry;
}
