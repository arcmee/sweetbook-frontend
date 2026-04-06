export type GroupCardSnapshot = {
  id: string;
  name: string;
  memberCount: number;
  role: string;
  eventCount: number;
};

export type EventCardSnapshot = {
  id: string;
  name: string;
  groupName: string;
  status: "draft" | "collecting" | "ready";
  photoCount: number;
};

export type WorkspaceSnapshot = {
  groupSummary: {
    totalGroups: number;
    totalMembers: number;
  };
  groups: GroupCardSnapshot[];
  events: EventCardSnapshot[];
};

export type PhotoCardSnapshot = {
  id: string;
  caption: string;
  uploadedBy: string;
  likeCount: number;
  likedByViewer: boolean;
  assetUrl?: string;
  assetFileName?: string;
  mediaType?: string;
};

export type PhotoWorkflowSnapshot = {
  activeEventId: string;
  activeEventName: string;
  uploadState: {
    pendingCount: number;
    uploadedCount: number;
    helperText: string;
  };
  photos: PhotoCardSnapshot[];
};

export type CandidateCardSnapshot = {
  photoId: string;
  caption: string;
  rank: number;
  likeCount: number;
  whySelected: string;
};

export type PagePreviewSnapshot = {
  pageNumber: number;
  title: string;
  photoCaptions: string[];
};

export type CandidateReviewSnapshot = {
  activeEventId: string;
  activeEventName: string;
  candidates: CandidateCardSnapshot[];
  pagePreview: PagePreviewSnapshot[];
};

export type OrderEntrySnapshot = {
  activeEventId: string;
  activeEventName: string;
  selectedCandidateCount: number;
  handoffSummary: {
    bookFormat: string;
    payloadSections: string[];
    note: string;
  };
};

export type PrototypeWorkspaceSnapshot = {
  workspace: WorkspaceSnapshot;
  photoWorkflows: PhotoWorkflowSnapshot[];
  candidateReviews: CandidateReviewSnapshot[];
  orderEntries: OrderEntrySnapshot[];
};
