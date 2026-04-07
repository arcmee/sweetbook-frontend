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
export type PrototypeGroupMemberViewModel = {
  userId: string;
  displayName: string;
  role: string;
};
export type PrototypeDashboardEventViewModel = {
  eventId: string;
  eventName: string;
  status: EventCardViewModel["status"];
  previewPhotos: Array<{
    photoId: string;
    caption: string;
    assetUrl?: string;
    likeCount: number;
  }>;
};
export type PrototypeDashboardGroupViewModel = {
  groupId: string;
  groupName: string;
  events: PrototypeDashboardEventViewModel[];
};

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
        ownerApproved: false,
        operationSummary: {
          stage: "voting",
          label: "Voting in progress",
          detail: "Collecting likes before the owner review opens.",
        },
        description: "Collect the best first birthday moments before the family vote closes.",
        votingStartsAt: "2026-04-01T09:00:00.000Z",
        votingEndsAt: "2026-04-14T09:00:00.000Z",
        votingClosedManually: false,
        canVote: true,
        canOwnerSelectPhotos: false,
        photoCount: 124,
      },
      {
        id: "event-holiday",
        name: "Winter holiday trip",
        groupName: "Park cousins",
        status: "draft",
        ownerApproved: false,
        operationSummary: {
          stage: "setup",
          label: "Setup in progress",
          detail: "Waiting for the voting window to open and more event setup to finish.",
        },
        description: "Prepare the holiday trip highlights before the cousins voting window opens.",
        votingStartsAt: "2026-04-20T09:00:00.000Z",
        votingEndsAt: "2026-04-30T09:00:00.000Z",
        votingClosedManually: false,
        canVote: false,
        canOwnerSelectPhotos: false,
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
      operationSummary: {
        stage: "ready_for_handoff",
        label: "Ready for handoff prep",
        detail: "Owner review can continue with a draft handoff summary.",
      },
      readinessSummary: {
        minimumSelectedPhotoCount: 3,
        selectedPhotoCount: 3,
        meetsMinimumPhotoCount: true,
        nextSuggestedStep: "Review page-level draft checks and record owner approval.",
      },
      handoffSummary: {
        bookFormat: "Hardcover square",
        payloadSections: ["selected photos", "page preview", "event title"],
        note: "Review this summary before backend submission is wired.",
      },
    },
  ],
  groupMembers: [
    {
      groupId: "group-han",
      userId: "user-demo",
      displayName: "SweetBook Demo User",
      role: "Owner",
    },
    {
      groupId: "group-han",
      userId: "user-mina",
      displayName: "Mina",
      role: "Editor",
    },
    {
      groupId: "group-han",
      userId: "user-joon",
      displayName: "Joon",
      role: "Contributor",
    },
    {
      groupId: "group-han",
      userId: "user-ara",
      displayName: "Ara",
      role: "Contributor",
    },
    {
      groupId: "group-park",
      userId: "user-soo",
      displayName: "Soo",
      role: "Owner",
    },
    {
      groupId: "group-park",
      userId: "user-demo",
      displayName: "SweetBook Demo User",
      role: "Editor",
    },
    {
      groupId: "group-park",
      userId: "user-yuri",
      displayName: "Yuri",
      role: "Contributor",
    },
  ],
  pendingInvitations: [
    {
      invitationId: "invite-kim",
      groupName: "Kim family moments",
      invitedByDisplayName: "Sena",
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

export function getPrototypeGroupMembersViewModel(
  groupId: string,
  snapshot: PrototypeWorkspaceSnapshot = defaultPrototypeWorkspaceSnapshot,
): PrototypeGroupMemberViewModel[] {
  const snapshotMembers =
    snapshot.groupMembers?.filter((member) => member.groupId === groupId) ?? [];
  if (snapshotMembers.length > 0) {
    return snapshotMembers.map((member) => ({
      userId: member.userId,
      displayName: member.displayName,
      role: member.role,
    }));
  }

  const group = snapshot.workspace.groups.find((item) => item.id === groupId);
  if (!group) {
    throw new Error(`Unknown group members for group: ${groupId}`);
  }

  return [
    {
      userId: "user-demo",
      displayName: "SweetBook Demo User",
      role: group.role,
    },
  ];
}

export function getPrototypeDashboardGroupsViewModel(
  snapshot: PrototypeWorkspaceSnapshot = defaultPrototypeWorkspaceSnapshot,
): PrototypeDashboardGroupViewModel[] {
  return snapshot.workspace.groups.map((group) => {
    const events = snapshot.workspace.events
      .filter((event) => event.groupName === group.name)
      .filter((event) => event.status === "collecting" || event.status === "draft")
      .map((event) => {
        const workflow = snapshot.photoWorkflows.find(
          (item) => item.activeEventId === event.id,
        );
        const previewPhotos = [...(workflow?.photos ?? [])]
          .sort((left, right) => right.likeCount - left.likeCount)
          .slice(0, 5)
          .map((photo) => ({
            photoId: photo.id,
            caption: photo.caption,
            assetUrl: photo.assetUrl,
            likeCount: photo.likeCount,
          }));

        return {
          eventId: event.id,
          eventName: event.name,
          status: event.status,
          previewPhotos,
        };
      });

    return {
      groupId: group.id,
      groupName: group.name,
      events,
    };
  });
}
