export type GroupCardViewModel = {
  id: string;
  name: string;
  memberCount: number;
  role: string;
  eventCount: number;
};

export type EventCardViewModel = {
  id: string;
  name: string;
  groupName: string;
  status: "draft" | "collecting" | "ready";
  photoCount: number;
};

export type PrototypeWorkspaceViewModel = {
  groupSummary: {
    totalGroups: number;
    totalMembers: number;
  };
  groups: GroupCardViewModel[];
  events: EventCardViewModel[];
};

export type PhotoCardViewModel = {
  id: string;
  caption: string;
  uploadedBy: string;
  likeCount: number;
  likedByViewer: boolean;
};

export type PrototypePhotoWorkflowViewModel = {
  activeEventId: string;
  activeEventName: string;
  uploadState: {
    pendingCount: number;
    uploadedCount: number;
    helperText: string;
  };
  photos: PhotoCardViewModel[];
};

export type CandidateCardViewModel = {
  photoId: string;
  caption: string;
  rank: number;
  likeCount: number;
  whySelected: string;
};

export type PagePreviewViewModel = {
  pageNumber: number;
  title: string;
  photoCaptions: string[];
};

export type PrototypeCandidateReviewViewModel = {
  activeEventId: string;
  activeEventName: string;
  candidates: CandidateCardViewModel[];
  pagePreview: PagePreviewViewModel[];
};

const prototypeWorkspaceViewModel: PrototypeWorkspaceViewModel = {
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
};

export function getPrototypeWorkspaceViewModel(): PrototypeWorkspaceViewModel {
  return prototypeWorkspaceViewModel;
}

const prototypePhotoWorkflows: Record<string, PrototypePhotoWorkflowViewModel> = {
  "event-birthday": {
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
  "event-holiday": {
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
};

export function getPrototypePhotoWorkflowViewModel(
  eventId: string,
): PrototypePhotoWorkflowViewModel {
  const workflow = prototypePhotoWorkflows[eventId];

  if (!workflow) {
    throw new Error(`Unknown photo workflow event: ${eventId}`);
  }

  return workflow;
}

const prototypeCandidateReviews: Record<string, PrototypeCandidateReviewViewModel> = {
  "event-birthday": {
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
};

export function getPrototypeCandidateReviewViewModel(
  eventId: string,
): PrototypeCandidateReviewViewModel {
  const review = prototypeCandidateReviews[eventId];

  if (!review) {
    throw new Error(`Unknown candidate review event: ${eventId}`);
  }

  return review;
}
