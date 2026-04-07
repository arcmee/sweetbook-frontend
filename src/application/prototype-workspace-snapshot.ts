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
  ownerApproved?: boolean;
  operationSummary: {
    stage: "setup" | "voting" | "owner_review";
    label: string;
    detail: string;
  };
  description?: string;
  votingStartsAt?: string;
  votingEndsAt?: string;
  votingClosedManually?: boolean;
  canVote?: boolean;
  canOwnerSelectPhotos?: boolean;
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
  pagePlanner: {
    selectedPhotoIds: string[];
    coverPhotoId?: string;
    pageLayouts: Record<string, string>;
    pageNotes: Record<string, string>;
  };
  operationSummary: {
    stage: "blocked" | "ready_for_handoff";
    label: string;
    detail: string;
  };
  readinessSummary: {
    minimumSelectedPhotoCount: number;
    selectedPhotoCount: number;
    meetsMinimumPhotoCount: boolean;
    nextSuggestedStep: string;
  };
  reviewSummary: {
    draftPageCount: number;
    flaggedDraftPageCount: number;
    ownerApprovalRequired: boolean;
  };
  handoffSummary: {
    bookFormat: string;
    payloadSections: string[];
    note: string;
    coverCaption?: string;
    selectedPhotoCount: number;
    spreadCount: number;
    draftPayloadPageCount: number;
    plannerPages: Array<{
      pageId: string;
      title: string;
      layout: string;
      note: string;
      photoCount: number;
      photoCaptions: string[];
      warning: string | null;
    }>;
  };
};

export type GroupMemberSnapshot = {
  groupId: string;
  userId: string;
  displayName: string;
  role: string;
};

export type PendingInvitationSnapshot = {
  invitationId: string;
  groupId: string;
  groupName: string;
  invitedUserId?: string;
  invitedUserDisplayName?: string;
  invitedByDisplayName: string;
};

export type PrototypeWorkspaceSnapshot = {
  workspace: WorkspaceSnapshot;
  groupMembers?: GroupMemberSnapshot[];
  pendingInvitations?: PendingInvitationSnapshot[];
  photoWorkflows: PhotoWorkflowSnapshot[];
  candidateReviews: CandidateReviewSnapshot[];
  orderEntries: OrderEntrySnapshot[];
};
