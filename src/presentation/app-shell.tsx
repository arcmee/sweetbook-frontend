import { useEffect, useState, type MouseEvent, type ReactElement } from "react";

import type { PrototypeAuthSession } from "../application/prototype-auth";
import {
  getDefaultPrototypeWorkspaceSnapshot,
  getPrototypeCandidateReviewViewModel,
  getPrototypeDashboardGroupsViewModel,
  getPrototypeGroupMembersViewModel,
  getPrototypeOrderEntryViewModel,
  getPrototypePhotoWorkflowViewModel,
  getPrototypeWorkspaceViewModel,
} from "../application/prototype-workspace";
import type { PrototypeWorkspaceSnapshot } from "../application/prototype-workspace-snapshot";
import {
  fetchPrototypeAuthSession,
  fetchPrototypeWorkspaceSnapshot,
  requestPrototypeEventCreate,
  requestPrototypeEventOwnerApproval,
  requestPrototypeEventVotingClose,
  requestPrototypeEventVotingExtend,
  requestPrototypeAuthLogout,
  requestPrototypePagePlanCover,
  requestPrototypePagePlanLayout,
  requestPrototypePagePlanNote,
  requestPrototypePagePlanSelection,
  requestPrototypeInvitationAccept,
  requestPrototypeInvitationDecline,
  requestPrototypePasswordChange,
  requestPrototypeGroupInvite,
  requestPrototypeGroupLeave,
  requestPrototypeGroupCreate,
  requestPrototypeOwnerTransfer,
  requestPrototypePhotoUpload,
  requestPrototypePhotoLike,
  searchPrototypeUsers,
} from "../data/prototype-api-client";
import {
  appRoutes,
  defaultRouteKey,
  getRouteByKey,
  getRouteByPath,
  type AppRouteKey,
} from "./routes";
import { AccountScreen } from "./screens/account-screen";
import { AlbumCandidateScreen } from "./screens/album-candidate-screen";
import { DashboardScreen } from "./screens/dashboard-screen";
import { EventScreen } from "./screens/event-screen";
import { GroupScreen } from "./screens/group-screen";
import { LandingScreen } from "./screens/landing-screen";
import { LoginScreen } from "./screens/login-screen";
import { OrderHandoffScreen } from "./screens/order-handoff-screen";
import { SignupScreen } from "./screens/signup-screen";
import { SpreadPlannerScreen } from "./screens/spread-planner-screen";
import { PageSection } from "./ui/page-section";
import { PrimaryAction } from "./ui/primary-action";
import { StatePanel } from "./ui/state-panel";

type AppShellProps = {
  currentRouteKey?: AppRouteKey;
  initialSession?: PrototypeAuthSession | null;
};

type NotificationActionViewModel = {
  id: string;
  message: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void | Promise<void>;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void | Promise<void>;
};

type SubmittedOrderViewModel = {
  bookUid: string;
  order: {
    orderStatusDisplay?: string | null;
    orderUid: string;
  };
  status: "submitted";
};

type SpreadDraftViewModel = {
  selectedPhotoIds: string[];
  coverPhotoId: string | null;
  pageLayouts: Record<string, string>;
  pageNotes: Record<string, string>;
  pageAssignments: Record<string, string[]>;
  ownerApproved: boolean;
};

const prototypeTokenStorageKey = "sweetbook.prototype.token";

export function AppShell({
  currentRouteKey,
  initialSession = null,
}: AppShellProps): ReactElement {
  const [activeRouteKey, setActiveRouteKey] = useState<AppRouteKey>(() => {
    if (currentRouteKey) {
      return currentRouteKey;
    }

    if (typeof window === "undefined") {
      return defaultRouteKey;
    }

    return getRouteByPath(window.location.pathname).key;
  });
  const [session, setSession] = useState<PrototypeAuthSession | null>(initialSession);
  const [authPending, setAuthPending] = useState(false);
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState<PrototypeWorkspaceSnapshot>(
    getDefaultPrototypeWorkspaceSnapshot(),
  );
  const [workspacePending, setWorkspacePending] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspaceSuccess, setWorkspaceSuccess] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [recentlyJoinedGroupId, setRecentlyJoinedGroupId] = useState<string | null>(null);
  const [ownerReviewEntryEventId, setOwnerReviewEntryEventId] = useState<string | null>(null);
  const [submittedOrdersByEvent, setSubmittedOrdersByEvent] = useState<
    Record<string, SubmittedOrderViewModel>
  >({});
  const [spreadDraftsByEvent, setSpreadDraftsByEvent] = useState<
    Record<string, SpreadDraftViewModel>
  >({});
  const [createGroupName, setCreateGroupName] = useState("");
  const [createEventTitle, setCreateEventTitle] = useState("");
  const [createEventDescription, setCreateEventDescription] = useState("");
  const [createEventVotingStartsAt, setCreateEventVotingStartsAt] = useState(() =>
    getDefaultVotingStartInput(),
  );
  const [createEventVotingEndsAt, setCreateEventVotingEndsAt] = useState(() =>
    getDefaultVotingEndInput(),
  );
  const [createPhotoCaption, setCreatePhotoCaption] = useState("");
  const [createPhotoFile, setCreatePhotoFile] = useState<File | null>(null);
  const [createPhotoPreviewUrl, setCreatePhotoPreviewUrl] = useState<string | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<
    Array<{ userId: string; username: string; displayName: string }>
  >([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  const [isTransferringOwner, setIsTransferringOwner] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingPhoto, setIsCreatingPhoto] = useState(false);
  const [isLikingPhoto, setIsLikingPhoto] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResolvingInvitation, setIsResolvingInvitation] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (currentRouteKey) {
      setActiveRouteKey(currentRouteKey);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const syncRouteFromLocation = () => {
      setActiveRouteKey(getRouteByPath(window.location.pathname).key);
    };

    syncRouteFromLocation();
    window.addEventListener("popstate", syncRouteFromLocation);

    return () => {
      window.removeEventListener("popstate", syncRouteFromLocation);
    };
  }, [currentRouteKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem(prototypeTokenStorageKey);
    if (!token) {
      setSession(null);
      setAuthPending(false);
      return;
    }

    setAuthPending(true);
    void fetchPrototypeAuthSession(token)
      .then((nextSession) => {
        setSession(nextSession);
      })
      .catch(() => {
        window.localStorage.removeItem(prototypeTokenStorageKey);
        setSession(null);
      })
      .finally(() => {
        setAuthPending(false);
      });
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    if (
      activeRouteKey === "landing" ||
      activeRouteKey === "signup" ||
      activeRouteKey === "login"
    ) {
      navigateTo("dashboard");
    }
  }, [activeRouteKey, session]);

  const currentRoute = getRouteByKey(activeRouteKey);
  const workspace = getPrototypeWorkspaceViewModel(workspaceSnapshot);
  const dashboardGroups = getPrototypeDashboardGroupsViewModel(workspaceSnapshot);
  const activeGroup =
    workspace.groups.find((group) => group.id === selectedGroupId) ?? workspace.groups[0];
  const canManageActiveGroup = activeGroup?.role === "Owner";
  const groupMembers = activeGroup
    ? getPrototypeGroupMembersViewModel(activeGroup.id, workspaceSnapshot)
    : [];
  const scopedEvents = activeGroup
    ? workspace.events.filter((event) => event.groupName === activeGroup.name)
    : workspace.events;
  const activeEvent =
    scopedEvents.find((event) => event.id === selectedEventId) ?? scopedEvents[0] ?? workspace.events[0];
  const activeEventId = activeEvent?.id ?? "";
  const workflow = resolveWorkspaceSlice(activeEventId, () =>
    getPrototypePhotoWorkflowViewModel(activeEventId, workspaceSnapshot),
  );
  const review = resolveWorkspaceSlice(activeEventId, () =>
    getPrototypeCandidateReviewViewModel(activeEventId, workspaceSnapshot),
  );
  const orderEntry = resolveWorkspaceSlice(activeEventId, () =>
    getPrototypeOrderEntryViewModel(activeEventId, workspaceSnapshot),
  );

  async function refreshWorkspace(): Promise<PrototypeWorkspaceSnapshot | null> {
    setWorkspacePending(true);
    setWorkspaceError(null);
    try {
      const snapshot = await fetchPrototypeWorkspaceSnapshot(session?.token);
      setWorkspaceSnapshot(snapshot);
      return snapshot;
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setWorkspacePending(false);
    }
  }

  useEffect(() => {
    if (!session) {
      setWorkspaceSnapshot(getDefaultPrototypeWorkspaceSnapshot());
      setWorkspacePending(false);
      setWorkspaceError(null);
      setWorkspaceSuccess(null);
      setSelectedGroupId(null);
      setSelectedEventId(null);
      setRecentlyJoinedGroupId(null);
      setOwnerReviewEntryEventId(null);
      setSubmittedOrdersByEvent({});
      setCreateEventDescription("");
      setCreateEventVotingStartsAt(getDefaultVotingStartInput());
      setCreateEventVotingEndsAt(getDefaultVotingEndInput());
      setInviteQuery("");
      setInviteResults([]);
      setIsInviteOpen(false);
      setCurrentPassword("");
      setNextPassword("");
      setCreatePhotoCaption("");
      setCreatePhotoFile(null);
      setIsNotificationOpen(false);
      return;
    }

    void refreshWorkspace();
  }, [session]);

  useEffect(() => {
    if (!createPhotoFile) {
      setCreatePhotoPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(createPhotoFile);
    setCreatePhotoPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [createPhotoFile]);

  useEffect(() => {
    const nextGroup =
      workspace.groups.find((group) => group.id === selectedGroupId) ?? workspace.groups[0];
    if (nextGroup && nextGroup.id !== selectedGroupId) {
      setSelectedGroupId(nextGroup.id);
      return;
    }

    if (!nextGroup) {
      setSelectedGroupId(null);
    }

    const nextScopedEvents = nextGroup
      ? workspace.events.filter((event) => event.groupName === nextGroup.name)
      : workspace.events;
    const nextEvent =
      nextScopedEvents.find((event) => event.id === selectedEventId) ?? nextScopedEvents[0];

    if (nextEvent && nextEvent.id !== selectedEventId) {
      setSelectedEventId(nextEvent.id);
      return;
    }

    if (!nextEvent) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, selectedGroupId, workspace.events, workspace.groups]);

  async function handleCreateGroup(): Promise<void> {
    const nextGroupName = createGroupName.trim();
    if (!nextGroupName) {
      setWorkspaceError("그룹 이름을 입력해야 합니다.");
      return;
    }

    try {
      setIsCreatingGroup(true);
      setWorkspaceSuccess(null);
      await requestPrototypeGroupCreate({
        name: nextGroupName,
        token: session?.token,
      });
      await refreshWorkspace();
      setCreateGroupName("");
      setWorkspaceSuccess(`그룹 ${nextGroupName}을(를) 만들었습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleCreateEvent(): Promise<void> {
    const targetGroup = activeGroup;
    if (!targetGroup) {
      setWorkspaceError("이벤트를 만들려면 먼저 그룹이 있어야 합니다.");
      return;
    }

    const nextEventTitle = createEventTitle.trim();
    const nextEventDescription = createEventDescription.trim();
    if (!nextEventTitle) {
      setWorkspaceError("이벤트 제목을 입력해야 합니다.");
      return;
    }
    if (!nextEventDescription) {
      setWorkspaceError("이벤트 설명을 입력해야 합니다.");
      return;
    }

    try {
      setIsCreatingEvent(true);
      setWorkspaceSuccess(null);
      await requestPrototypeEventCreate({
        groupId: targetGroup.id,
        title: nextEventTitle,
        description: nextEventDescription,
        votingStartsAt: toIsoDateTime(createEventVotingStartsAt),
        votingEndsAt: toIsoDateTime(createEventVotingEndsAt),
      });
      await refreshWorkspace();
      setCreateEventTitle("");
      setCreateEventDescription("");
      setCreateEventVotingStartsAt(getDefaultVotingStartInput());
      setCreateEventVotingEndsAt(getDefaultVotingEndInput());
      setWorkspaceSuccess(`이벤트 ${nextEventTitle}을(를) 만들었습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingEvent(false);
    }
  }

  async function handleCreatePhoto(): Promise<void> {
    if (!activeEvent) {
      setWorkspaceError("사진을 추가하려면 먼저 이벤트를 선택해야 합니다.");
      return;
    }

    const nextCaption = createPhotoCaption.trim();
    if (!nextCaption) {
      setWorkspaceError("사진 설명을 입력해야 합니다.");
      return;
    }
    if (!createPhotoFile) {
      setWorkspaceError("사진 파일을 선택해야 합니다.");
      return;
    }

    try {
      setIsCreatingPhoto(true);
      setWorkspaceSuccess(null);
      await requestPrototypePhotoUpload({
        eventId: activeEvent.id,
        caption: nextCaption,
        file: createPhotoFile,
      });
      await refreshWorkspace();
      setCreatePhotoCaption("");
      setCreatePhotoFile(null);
      setWorkspaceSuccess(`사진 ${nextCaption}을(를) 업로드했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingPhoto(false);
    }
  }

  async function handleLikePhoto(photoId: string): Promise<void> {
    try {
      setIsLikingPhoto(true);
      setWorkspaceSuccess(null);
      if (!session?.user.userId) {
        throw new Error("좋아요를 누르려면 로그인된 사용자가 필요합니다.");
      }
      await requestPrototypePhotoLike({
        photoId,
        userId: session.user.userId,
      });
      await refreshWorkspace();
      setWorkspaceSuccess("사진 좋아요를 저장했습니다.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLikingPhoto(false);
    }
  }

  async function handleCloseVoting(): Promise<void> {
    if (!activeEvent?.id) {
      return;
    }

    try {
      setWorkspaceSuccess(null);
      await requestPrototypeEventVotingClose({
        eventId: activeEvent.id,
      });
      await refreshWorkspace();
      setWorkspaceSuccess(`${activeEvent.name} 이벤트의 투표를 종료했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleExtendVoting(): Promise<void> {
    if (!activeEvent?.id || !activeEvent.votingEndsAt) {
      return;
    }

    const nextVotingEndsAt = new Date(activeEvent.votingEndsAt);
    nextVotingEndsAt.setDate(nextVotingEndsAt.getDate() + 3);

    try {
      setWorkspaceSuccess(null);
      await requestPrototypeEventVotingExtend({
        eventId: activeEvent.id,
        votingEndsAt: nextVotingEndsAt.toISOString(),
      });
      await refreshWorkspace();
      setWorkspaceSuccess(`${activeEvent.name} 이벤트의 투표 기간을 연장했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleSearchUsers(): Promise<void> {
    const nextQuery = inviteQuery.trim();
    if (!nextQuery) {
      setInviteResults([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      setWorkspaceSuccess(null);
      const results = await searchPrototypeUsers(nextQuery);
      setInviteResults(
        results.filter(
          (result) => !groupMembers.some((member) => member.userId === result.userId),
        ),
      );
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSearchingUsers(false);
    }
  }

  async function handleInviteMember(userId: string): Promise<void> {
    if (!activeGroup?.id) {
      return;
    }

    try {
      setIsInvitingMember(true);
      await requestPrototypeGroupInvite({
        groupId: activeGroup.id,
        userId,
      });
      await refreshWorkspace();
      setInviteResults((current) => current.filter((result) => result.userId !== userId));
      setWorkspaceSuccess(`${activeGroup.name} 그룹에 ${userId} 사용자를 초대했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsInvitingMember(false);
    }
  }

  async function handleAcceptInvitation(invitationId: string, groupName: string): Promise<void> {
    if (!session?.user.userId) {
      return;
    }

    try {
      setIsResolvingInvitation(true);
      setWorkspaceSuccess(null);
      await requestPrototypeInvitationAccept({
        invitationId,
        userId: session.user.userId,
      });
      const nextSnapshot = await refreshWorkspace();
      const nextWorkspace = nextSnapshot
        ? getPrototypeWorkspaceViewModel(nextSnapshot)
        : null;
      const joinedGroup = nextWorkspace?.groups.find((group) => group.name === groupName);
      if (joinedGroup) {
        setSelectedGroupId(joinedGroup.id);
        setRecentlyJoinedGroupId(joinedGroup.id);
        const nextEvent = nextWorkspace.events.find(
          (event) => event.groupName === joinedGroup.name,
        );
        setSelectedEventId(nextEvent?.id ?? null);
        navigateTo("groups");
      }
      setWorkspaceSuccess(`${groupName} 그룹에 참여했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsResolvingInvitation(false);
    }
  }

  async function handleDeclineInvitation(invitationId: string, groupName: string): Promise<void> {
    if (!session?.user.userId) {
      return;
    }

    try {
      setIsResolvingInvitation(true);
      setWorkspaceSuccess(null);
      await requestPrototypeInvitationDecline({
        invitationId,
        userId: session.user.userId,
      });
      await refreshWorkspace();
      setWorkspaceSuccess(`${groupName} 그룹 초대를 거절했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsResolvingInvitation(false);
    }
  }

  async function handleTransferOwner(nextOwnerUserId: string): Promise<void> {
    if (!activeGroup?.id) {
      return;
    }

    try {
      setIsTransferringOwner(true);
      await requestPrototypeOwnerTransfer({
        groupId: activeGroup.id,
        nextOwnerUserId,
      });
      await refreshWorkspace();
      setWorkspaceSuccess(`오너 권한을 ${nextOwnerUserId} 사용자에게 위임했습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTransferringOwner(false);
    }
  }

  async function handleLeaveGroup(): Promise<void> {
    if (!activeGroup?.id || !session?.user.userId) {
      return;
    }

    const leavingGroupName = activeGroup.name;

    try {
      setIsLeavingGroup(true);
      await requestPrototypeGroupLeave({
        groupId: activeGroup.id,
        userId: session.user.userId,
      });
      await refreshWorkspace();
      setSelectedGroupId(null);
      setSelectedEventId(null);
      navigateTo("dashboard");
      setWorkspaceSuccess(`${leavingGroupName} 그룹에서 나갔습니다.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLeavingGroup(false);
    }
  }

  async function handlePasswordChange(): Promise<void> {
    if (!currentPassword.trim() || !nextPassword.trim()) {
      setWorkspaceError("현재 비밀번호와 새 비밀번호를 모두 입력해야 합니다.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await requestPrototypePasswordChange({
        token: session?.token ?? "",
        currentPassword,
        nextPassword,
      });
      setCurrentPassword("");
      setNextPassword("");
      setWorkspaceSuccess("비밀번호를 변경했습니다.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleTogglePhotoSelection(photoId: string): Promise<void> {
    if (!activeEventId) {
      return;
    }

    try {
      setWorkspaceSuccess(null);
      const existing = orderEntry?.pagePlanner?.selectedPhotoIds ?? [];
      const nextSelection = existing.includes(photoId)
        ? existing.filter((id) => id !== photoId)
        : [...existing, photoId];
      await requestPrototypePagePlanSelection({
        eventId: activeEventId,
        selectedPhotoIds: nextSelection,
      });
      await refreshWorkspace();
      setWorkspaceSuccess("책에 넣을 사진 구성을 업데이트했습니다.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleSetCoverPhoto(photoId: string): Promise<void> {
    if (!activeEventId) {
      return;
    }

    try {
      setWorkspaceSuccess(null);
      const existingSelection = orderEntry?.pagePlanner?.selectedPhotoIds ?? [];
      if (!existingSelection.includes(photoId)) {
        await requestPrototypePagePlanSelection({
          eventId: activeEventId,
          selectedPhotoIds: [...existingSelection, photoId],
        });
      }
      await requestPrototypePagePlanCover({
        eventId: activeEventId,
        coverPhotoId: photoId,
      });
      await refreshWorkspace();
      setWorkspaceSuccess("앨범 커버를 업데이트했습니다.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleSetPageLayout(pageId: string, layout: string): Promise<void> {
    if (!activeEventId) {
      return;
    }

    try {
      setWorkspaceSuccess(null);
      await requestPrototypePagePlanLayout({
        eventId: activeEventId,
        pageId,
        layout,
      });
      await refreshWorkspace();
      setWorkspaceSuccess("초안 페이지 레이아웃을 수정했습니다.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleSetPageNote(pageId: string, note: string): Promise<void> {
    if (!activeEventId) {
      return;
    }

    try {
      setWorkspaceSuccess(null);
      await requestPrototypePagePlanNote({
        eventId: activeEventId,
        pageId,
        note,
      });
      await refreshWorkspace();
      setWorkspaceSuccess("초안 페이지 메모를 수정했습니다.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleToggleOwnerApproval(): Promise<void> {
    if (!activeEventId) {
      return;
    }

    try {
      const isApproved = activeEvent?.ownerApproved ?? false;
      setWorkspaceSuccess(null);
      await requestPrototypeEventOwnerApproval({
        eventId: activeEventId,
        ownerApproved: !isApproved,
      });
      await refreshWorkspace();
      setWorkspaceSuccess(
        isApproved
          ? "초안 오너 승인을 해제했습니다."
          : "초안 오너 승인을 기록했습니다.",
      );
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  async function moveSelectedPhoto(photoId: string, direction: -1 | 1): Promise<void> {
    if (!activeEventId) {
      return;
    }

    const existing = orderEntry?.pagePlanner?.selectedPhotoIds ?? [];
    const coverId = orderEntry?.pagePlanner?.coverPhotoId ?? existing[0];
    const spreadIds = existing.filter((id) => id !== coverId);
    const currentIndex = spreadIds.indexOf(photoId);

    if (currentIndex === -1) {
      return;
    }

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= spreadIds.length) {
      return;
    }

    const nextSpreadIds = [...spreadIds];
    const [movedId] = nextSpreadIds.splice(currentIndex, 1);
    nextSpreadIds.splice(targetIndex, 0, movedId);

    try {
      setWorkspaceSuccess(null);
      await requestPrototypePagePlanSelection({
        eventId: activeEventId,
        selectedPhotoIds: coverId ? [coverId, ...nextSpreadIds] : nextSpreadIds,
      });
      await refreshWorkspace();
      setWorkspaceSuccess(
        direction < 0
          ? "선택한 스프레드를 앞쪽으로 이동했습니다."
          : "선택한 스프레드를 뒤쪽으로 이동했습니다.",
      );
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  function handleSelectGroup(groupId: string): void {
    setSelectedGroupId(groupId);
    setRecentlyJoinedGroupId((current) => (current === groupId ? current : null));
    setOwnerReviewEntryEventId(null);
    const nextGroup = workspace.groups.find((group) => group.id === groupId);
    const nextEvent = workspace.events.find((event) => event.groupName === nextGroup?.name);
    setSelectedEventId(nextEvent?.id ?? null);
    navigateTo("groups");
  }

  function handleSelectEvent(eventId: string): void {
    setSelectedEventId(eventId);
    setOwnerReviewEntryEventId(null);
    const nextEvent = workspace.events.find((event) => event.id === eventId);
    const nextGroup = workspace.groups.find((group) => group.name === nextEvent?.groupName);
    if (nextGroup) {
      setSelectedGroupId(nextGroup.id);
    }
    navigateTo("events");
  }

  function handleOpenOwnerReview(eventId: string): void {
    setSelectedEventId(eventId);
    setOwnerReviewEntryEventId(eventId);
    const nextEvent = workspace.events.find((event) => event.id === eventId);
    const nextGroup = workspace.groups.find((group) => group.name === nextEvent?.groupName);
    if (nextGroup) {
      setSelectedGroupId(nextGroup.id);
    }
    navigateTo("albums");
  }

  function buildSpreadDraft(): SpreadDraftViewModel {
    const persistedSelectedPhotoIds = orderEntry?.pagePlanner?.selectedPhotoIds ?? [];
    const persistedCoverPhotoId =
      orderEntry?.pagePlanner?.coverPhotoId ?? persistedSelectedPhotoIds[0] ?? null;
    const spreadIds = persistedSelectedPhotoIds.filter((id) => id !== persistedCoverPhotoId);
    const pageAssignments: Record<string, string[]> = {};
    for (let index = 0; index < spreadIds.length; index += 2) {
      pageAssignments[`spread-${Math.floor(index / 2) + 1}`] = spreadIds.slice(index, index + 2);
    }
    return {
      selectedPhotoIds: persistedSelectedPhotoIds,
      coverPhotoId: persistedCoverPhotoId,
      pageLayouts: { ...(orderEntry?.pagePlanner?.pageLayouts ?? {}) },
      pageNotes: { ...(orderEntry?.pagePlanner?.pageNotes ?? {}) },
      pageAssignments,
      ownerApproved: activeEvent?.ownerApproved ?? false,
    };
  }

  function updateSpreadDraft(
    updater: (current: SpreadDraftViewModel) => SpreadDraftViewModel,
  ): void {
    if (!activeEventId) {
      return;
    }

    setSpreadDraftsByEvent((current) => {
      const baseDraft = current[activeEventId] ?? buildSpreadDraft();
      return {
        ...current,
        [activeEventId]: updater(baseDraft),
      };
    });
  }

  function handleOpenSpreadPlanner(): void {
    if (activeEventId) {
      setSpreadDraftsByEvent((current) => ({
        ...current,
        [activeEventId]: buildSpreadDraft(),
      }));
    }
    navigateTo("spreads");
  }

  function handleDraftSetCoverPhoto(photoId: string): void {
    updateSpreadDraft((current) => ({
      ...current,
      selectedPhotoIds: current.selectedPhotoIds.includes(photoId)
        ? current.selectedPhotoIds
        : [...current.selectedPhotoIds, photoId],
      coverPhotoId: photoId,
    }));
  }

  function handleDraftAssignPhotoToSlot(pageId: string, slotIndex: number, photoId: string): void {
    updateSpreadDraft((current) => {
      const nextAssignments = Object.fromEntries(
        Object.entries(current.pageAssignments).map(([assignmentPageId, ids]) => [
          assignmentPageId,
          ids.filter((id) => id !== photoId),
        ]),
      ) as Record<string, string[]>;
      const targetAssignments = [...(nextAssignments[pageId] ?? [])];
      targetAssignments[slotIndex] = photoId;
      nextAssignments[pageId] = targetAssignments.filter(Boolean);

      const nextSelectedPhotoIds = current.selectedPhotoIds.includes(photoId)
        ? current.selectedPhotoIds
        : [...current.selectedPhotoIds, photoId];

      return {
        ...current,
        selectedPhotoIds: nextSelectedPhotoIds,
        pageAssignments: nextAssignments,
      };
    });
  }

  function handleDraftSetPageLayout(pageId: string, layout: string): void {
    updateSpreadDraft((current) => ({
      ...current,
      pageLayouts: {
        ...current.pageLayouts,
        [pageId]: layout,
      },
    }));
  }

  function handleDraftSetPageNote(pageId: string, note: string): void {
    updateSpreadDraft((current) => ({
      ...current,
      pageNotes: {
        ...current.pageNotes,
        [pageId]: note,
      },
    }));
  }

  function handleDraftToggleOwnerApproval(): void {
    updateSpreadDraft((current) => ({
      ...current,
      ownerApproved: !current.ownerApproved,
    }));
  }

  function moveDraftSelectedPhoto(photoId: string, direction: -1 | 1): void {
    updateSpreadDraft((current) => {
      const coverId = current.coverPhotoId ?? current.selectedPhotoIds[0] ?? null;
      const spreadIds = current.selectedPhotoIds.filter((id) => id !== coverId);
      const currentIndex = spreadIds.indexOf(photoId);
      if (currentIndex === -1) {
        return current;
      }

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= spreadIds.length) {
        return current;
      }

      const nextSpreadIds = [...spreadIds];
      const [movedId] = nextSpreadIds.splice(currentIndex, 1);
      nextSpreadIds.splice(targetIndex, 0, movedId);

      return {
        ...current,
        selectedPhotoIds: coverId ? [coverId, ...nextSpreadIds] : nextSpreadIds,
      };
    });
  }

  async function handleConfirmSpreadDraftAndOpenOrder(): Promise<void> {
    if (!activeEventId) {
      return;
    }

    const draft = spreadDraftsByEvent[activeEventId] ?? buildSpreadDraft();
    const orderedSpreadIds = Object.entries(draft.pageAssignments)
      .sort(([left], [right]) => {
        const leftNumber = Number(left.replace("spread-", ""));
        const rightNumber = Number(right.replace("spread-", ""));
        return leftNumber - rightNumber;
      })
      .flatMap(([, ids]) => ids.filter(Boolean));
    const uniqueAssignedSpreadIds = [...new Set(orderedSpreadIds)];
    const remainingIds = draft.selectedPhotoIds.filter(
      (id) => id !== draft.coverPhotoId && !uniqueAssignedSpreadIds.includes(id),
    );
    const persistedSelection = draft.coverPhotoId
      ? [draft.coverPhotoId, ...uniqueAssignedSpreadIds, ...remainingIds]
      : [...uniqueAssignedSpreadIds, ...remainingIds];

    try {
      setWorkspaceSuccess(null);
      await requestPrototypePagePlanSelection({
        eventId: activeEventId,
        selectedPhotoIds: persistedSelection,
      });

      if (draft.coverPhotoId) {
        await requestPrototypePagePlanCover({
          eventId: activeEventId,
          coverPhotoId: draft.coverPhotoId,
        });
      }

      for (const [pageId, layout] of Object.entries(draft.pageLayouts)) {
        await requestPrototypePagePlanLayout({
          eventId: activeEventId,
          pageId,
          layout,
        });
      }

      for (const [pageId, note] of Object.entries(draft.pageNotes)) {
        await requestPrototypePagePlanNote({
          eventId: activeEventId,
          pageId,
          note,
        });
      }

      if ((activeEvent?.ownerApproved ?? false) !== draft.ownerApproved) {
        await requestPrototypeEventOwnerApproval({
          eventId: activeEventId,
          ownerApproved: draft.ownerApproved,
        });
      }

      await refreshWorkspace();
      setWorkspaceSuccess("책 구성을 저장하고 주문 단계로 이동했습니다.");
      navigateTo("orders");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    }
  }

  const selectedPhotoIds = orderEntry?.pagePlanner?.selectedPhotoIds ?? [];
  const spreadDraft = activeEventId ? spreadDraftsByEvent[activeEventId] : undefined;
  const spreadDraftSelectedPhotoIds = spreadDraft?.selectedPhotoIds ?? selectedPhotoIds;
  const spreadDraftCoverPhotoId =
    spreadDraft?.coverPhotoId ?? orderEntry?.pagePlanner?.coverPhotoId ?? selectedPhotoIds[0];
  const selectedPhotos =
    workflow?.photos.filter((photo) => selectedPhotoIds.includes(photo.id)) ?? [];
  const selectedCoverPhoto =
    selectedPhotos.find((photo) => photo.id === orderEntry?.pagePlanner?.coverPhotoId) ??
    selectedPhotos[0];
  const selectedSpreadPhotos = selectedPhotos.filter(
    (photo) => photo.id !== selectedCoverPhoto?.id,
  );
  const spreadDraftPhotos =
    workflow?.photos.filter((photo) => spreadDraftSelectedPhotoIds.includes(photo.id)) ?? [];
  const spreadDraftCoverPhoto =
    spreadDraftPhotos.find((photo) => photo.id === spreadDraftCoverPhotoId) ??
    spreadDraftPhotos[0];
  const persistedPageAssignments = Object.fromEntries(
    (orderEntry?.handoffSummary?.plannerPages ?? [])
      .filter((page) => page.pageId !== "cover")
      .map((page) => [
        page.pageId,
        (page.photoCaptions ?? [])
          .map((caption) => workflow?.photos.find((photo) => photo.caption === caption)?.id)
          .filter((photoId): photoId is string => Boolean(photoId)),
      ]),
  ) as Record<string, string[]>;
  const effectiveSpreadDraftAssignments =
    spreadDraft?.pageAssignments ?? persistedPageAssignments;
  const spreadDraftAssignedPhotoIds = Object.values(effectiveSpreadDraftAssignments).flat();
  const unassignedSpreadDraftPhotos = spreadDraftPhotos.filter(
    (photo) =>
      photo.id !== spreadDraftCoverPhoto?.id &&
      !spreadDraftAssignedPhotoIds.includes(photo.id),
  );
  const isOwnerApproved = activeEvent?.ownerApproved ?? false;
  const activeEventOperationStage = activeEvent ? getOperationStage(activeEvent) : undefined;
  const canOpenOwnerSelection =
    canManageActiveGroup &&
    activeEventOperationStage === "owner_review" &&
    Boolean(activeEvent?.canOwnerSelectPhotos);
  const selectionLockState = getSelectionLockState(activeEventOperationStage, canManageActiveGroup);
  const orderLockState = getOrderLockState(activeEventOperationStage, canManageActiveGroup);
  const myGroups = workspace.groups;
  const submittedEventIds = new Set(Object.keys(submittedOrdersByEvent));
  const voteNotifications: NotificationActionViewModel[] = workspace.events
    .filter((event) => !submittedEventIds.has(event.id))
    .filter((event) => getOperationStage(event) === "voting")
    .filter((event) => {
      const eventWorkflow = resolveWorkspaceSlice(event.id, () =>
        getPrototypePhotoWorkflowViewModel(event.id, workspaceSnapshot),
      );

      return !eventWorkflow?.photos.some((photo) => photo.likedByViewer);
    })
    .map((event) => ({
      id: `vote-${event.id}`,
      message: `${event.name} 이벤트에 아직 좋아요를 남기지 않았습니다.`, 
      primaryActionLabel: "이벤트 열기",
      onPrimaryAction: () => handleSelectEvent(event.id),
    }));
  const urgentVoteNotifications: NotificationActionViewModel[] = workspace.events
    .filter((event) => !submittedEventIds.has(event.id))
    .filter(
      (event) => getOperationStage(event) === "voting" && isVotingClosingSoon(event.votingEndsAt),
    )
    .map((event) => ({
      id: `urgent-vote-${event.id}`,
      message: `${event.name} 이벤트가 곧 마감됩니다. ${formatNotificationDate(event.votingEndsAt)}까지 투표를 완료해보세요.`, 
      primaryActionLabel: "급한 투표 열기",
      onPrimaryAction: () => handleSelectEvent(event.id),
    }));
  const ownerReviewNotifications: NotificationActionViewModel[] = workspace.events
    .filter((event) => !submittedEventIds.has(event.id))
    .filter(
      (event) =>
        getOperationStage(event) === "owner_review" &&
        workspace.groups.some(
          (group) => group.name === event.groupName && group.role === "Owner",
        ),
    )
    .map((event) => ({
      id: `owner-review-${event.id}`,
      message: `${event.name} 이벤트는 오너 사진 선택과 SweetBook 제출 준비가 가능합니다.`, 
      primaryActionLabel: "SweetBook 작업 열기",
      onPrimaryAction: () => handleOpenOwnerReview(event.id),
    }));
  const invitationNotifications: NotificationActionViewModel[] = (
    workspaceSnapshot.pendingInvitations ?? []
  ).map(
    (invitation) => ({
      id: invitation.invitationId,
      message: `${invitation.invitedByDisplayName} 님이 ${invitation.groupName} 그룹에 초대했습니다.`, 
      primaryActionLabel: isResolvingInvitation ? "수락 중..." : "초대 수락",
      onPrimaryAction: () =>
        handleAcceptInvitation(invitation.invitationId, invitation.groupName),
      secondaryActionLabel: isResolvingInvitation ? "거절 중..." : "거절",
      onSecondaryAction: () =>
        handleDeclineInvitation(invitation.invitationId, invitation.groupName),
    }),
  );
  const notifications = [
    ...invitationNotifications,
    ...urgentVoteNotifications,
    ...ownerReviewNotifications,
    ...voteNotifications,
  ];
  const notificationGroups = [
    {
      title: "그룹 초대",
      emptyMessage: "대기 중인 초대가 없습니다.",
      items: invitationNotifications,
    },
    {
      title: "마감 임박 투표",
      emptyMessage: "곧 마감되는 투표가 없습니다.",
      items: urgentVoteNotifications,
    },
    {
      title: "오너 검토 대기",
      emptyMessage: "오너 검토를 기다리는 이벤트가 없습니다.",
      items: ownerReviewNotifications,
    },
    {
      title: "투표 알림",
      emptyMessage: "지금 필요한 투표 알림이 없습니다.",
      items: voteNotifications,
    },
  ];
  const dashboardActions = [
    ...invitationNotifications.map((notification) => ({
      id: `dashboard-${notification.id}`,
      title: "그룹 초대 확인",
      description: notification.message,
      ctaLabel: notification.primaryActionLabel,
      onCta: () => void notification.onPrimaryAction(),
    })),
    ...urgentVoteNotifications.map((notification) => ({
      id: `dashboard-${notification.id}`,
      title: "마감 전에 투표하기",
      description: notification.message,
      ctaLabel: notification.primaryActionLabel,
      onCta: () => void notification.onPrimaryAction(),
    })),
    ...ownerReviewNotifications.map((notification) => ({
      id: `dashboard-${notification.id}`,
      title: "SweetBook 작업 이어가기",
      description: notification.message,
      ctaLabel: notification.primaryActionLabel,
      onCta: () => void notification.onPrimaryAction(),
    })),
    ...voteNotifications.map((notification) => ({
      id: `dashboard-${notification.id}`,
      title: "진행 중인 이벤트에 투표하기",
      description: notification.message,
      ctaLabel: notification.primaryActionLabel,
      onCta: () => void notification.onPrimaryAction(),
    })),
    ...(recentlyJoinedGroupId
      ? [
          {
            id: `joined-${recentlyJoinedGroupId}`,
            title: "새로 참여한 그룹 둘러보기",
            description: `${activeGroup?.id === recentlyJoinedGroupId ? activeGroup.name : workspace.groups.find((group) => group.id === recentlyJoinedGroupId)?.name ?? "참여한 그룹"}에서 다음 투표나 이벤트를 확인해보세요.`, 
            ctaLabel: "그룹 페이지 열기",
            onCta: () => handleSelectGroup(recentlyJoinedGroupId),
          },
        ]
      : []),
  ];
  const completedOrdersForDashboard = Object.fromEntries(
    Object.entries(submittedOrdersByEvent).map(([eventId, order]) => {
      const event = workspace.events.find((item) => item.id === eventId);
      const group = workspace.groups.find((item) => item.name === event?.groupName);

      return [
        eventId,
        {
          ...order,
          groupId: group?.id ?? "",
          groupName: event?.groupName ?? "알 수 없는 그룹",
        },
      ];
    }),
  );

  function handleSubmitSuccess(result: SubmittedOrderViewModel): void {
    if (!activeEventId) {
      return;
    }

    setSubmittedOrdersByEvent((current) => ({
      ...current,
      [activeEventId]: result,
    }));
    setWorkspaceSuccess(`${activeEvent?.name ?? "이 이벤트"}의 SweetBook 작업을 완료했습니다.`);
  }

  function navigateTo(routeKey: AppRouteKey): void {
    if (routeKey !== "albums") {
      setOwnerReviewEntryEventId(null);
    }

    setIsNotificationOpen(false);

    if (typeof window !== "undefined") {
      window.history.pushState({}, "", getRouteByKey(routeKey).path);
    }

    setActiveRouteKey(routeKey);
  }

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    routeKey: AppRouteKey,
  ): void {
    if (typeof window === "undefined") {
      return;
    }

    event.preventDefault();
    navigateTo(routeKey);
  }

  function handleLogin(nextSession: PrototypeAuthSession): void {
    setSession(nextSession);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(prototypeTokenStorageKey, nextSession.token);
    }

    navigateTo("dashboard");
  }

  function handleSignup(nextSession: PrototypeAuthSession): void {
    handleLogin(nextSession);
  }

  async function handleLogout(): Promise<void> {
    const token = session?.token;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(prototypeTokenStorageKey);
    }

    setSession(null);
    navigateTo("login");

    if (token) {
      await requestPrototypeAuthLogout(token);
    }
  }

  if (authPending) {
    return (
      <main>
        <StatePanel
          tone="loading"
          title="로그인 상태를 확인하는 중입니다"
          description="저장된 로그인 정보를 확인하고 보호된 화면 접근 여부를 정리하고 있습니다."
        />
      </main>
    );
  }

  if (currentRoute.requiresAuth && !session) {
    return (
      <main>
        <LoginScreen onLogin={handleLogin} />
      </main>
    );
  }

  if (!session && (currentRoute.key === "landing" || currentRoute.key === "signup" || currentRoute.key === "login")) {
    return (
      <main>
        <nav aria-label="공개 네비게이션">
          <ul>
            {appRoutes
              .filter((route) => route.key === "landing")
              .map((route) => (
                <li key={route.key}>
                  <a
                    href={route.path}
                    aria-current={currentRoute.key === route.key ? "page" : undefined}
                    onClick={(event) => handleNavigation(event, route.key)}
                  >
                    {route.label}
                  </a>
                </li>
              ))}
          </ul>
        </nav>

        {currentRoute.key === "landing" ? (
          <LandingScreen
            onOpenLogin={() => navigateTo("login")}
            onOpenSignup={() => navigateTo("signup")}
          />
        ) : null}
        {currentRoute.key === "signup" ? (
          <SignupScreen
            onOpenLogin={() => navigateTo("login")}
            onSignup={handleSignup}
          />
        ) : null}
        {currentRoute.key === "login" ? (
          <LoginScreen onLogin={handleLogin} onOpenSignup={() => navigateTo("signup")} />
        ) : null}
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 md:px-6 md:py-8">
      <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between md:p-8">
          <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
              사진을 함께 모으고 고르고 책으로 남기는 공간
            </p>
            <div className="grid gap-3">
              <a
                href={session ? "/app" : "/"}
                onClick={(event) => {
                  if (session) {
                    event.preventDefault();
                    navigateTo("dashboard");
                  }
                }}
                className="w-fit text-4xl font-semibold tracking-tight text-slate-950 transition hover:text-teal-700 md:text-5xl"
              >
                groupictures
              </a>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                그룹 단위로 사진을 모으고 투표한 뒤 SweetBook 작업까지 이어갈 수 있습니다.
              </p>
            </div>
            {session ? (
              <p className="inline-flex w-fit items-center rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
                {session.user.displayName} 계정으로 로그인 중
              </p>
            ) : null}
          </div>
          {session ? (
            <div className="flex items-center gap-3 self-start">
              <button
                type="button"
                aria-label="알림"
                onClick={() => setIsNotificationOpen((current) => !current)}
                className="inline-flex min-w-14 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                🔔 {notifications.length}
              </button>
              <button
                type="button"
                aria-label="계정"
                onClick={() => navigateTo("account")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                {session.user.displayName.slice(0, 1)}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {session && isNotificationOpen ? (
        <div
          aria-label="알림 모달 배경"
          onClick={() => setIsNotificationOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6"
        >
          <section
            aria-label="알림 모달"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
          >
            <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5 md:px-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                    Notification Center
                  </p>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                      알림 센터
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      지금 바로 확인해야 하는 초대, 투표, SweetBook 작업을 한곳에서 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  닫기
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  전체 알림 {notifications.length}건
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                  그룹 초대 {invitationNotifications.length}건
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                  마감 임박 {urgentVoteNotifications.length}건
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                  오너 검토 {ownerReviewNotifications.length}건
                </div>
              </div>
            </div>

            <div className="grid max-h-[72vh] gap-4 overflow-y-auto px-6 py-6 md:px-8">
              {notificationGroups.map((group) => (
                <section
                  key={group.title}
                  aria-label={group.title}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{group.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {group.items.length > 0
                          ? `${group.items.length}개의 알림이 있습니다.`
                          : group.emptyMessage}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {group.items.length}건
                    </span>
                  </div>
                  {group.items.length > 0 ? (
                    <ul className="mt-4 grid gap-3">
                      {group.items.map((notification) => (
                        <li
                          key={notification.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          <p className="text-sm leading-6 text-slate-700">
                            {notification.message}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void notification.onPrimaryAction()}
                              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              {notification.primaryActionLabel}
                            </button>
                            {notification.secondaryActionLabel && notification.onSecondaryAction ? (
                              <button
                                type="button"
                                onClick={() => void notification.onSecondaryAction?.()}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                              >
                                {notification.secondaryActionLabel}
                              </button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      {group.emptyMessage}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {workspacePending ? (
        <StatePanel
          tone="loading"
          title="워크스페이스를 불러오는 중입니다"
          description="백엔드에서 최신 작업 상태를 가져오고 있습니다."
        />
      ) : null}
      {workspaceError ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={() => setWorkspaceError(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-rose-600">오류</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  요청을 처리하지 못했습니다
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceError(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                닫기
              </button>
            </div>
            <StatePanel tone="error" title="문제가 발생했습니다" description={workspaceError} />
          </div>
        </div>
      ) : null}
      {workspaceSuccess ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={() => setWorkspaceSuccess(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600">완료</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  작업이 반영되었습니다
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceSuccess(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                닫기
              </button>
            </div>
            <StatePanel
              tone="success"
              title="워크스페이스가 업데이트되었습니다"
              description={workspaceSuccess}
            />
          </div>
        </div>
      ) : null}

      {currentRoute.key === "dashboard" ? (
        <DashboardScreen
          workspace={workspace}
          groupedEvents={dashboardGroups}
          createGroupName={createGroupName}
          isCreatingGroup={isCreatingGroup}
          nextActions={dashboardActions}
          onCreateGroup={handleCreateGroup}
          onCreateGroupNameChange={setCreateGroupName}
          onOpenGroup={handleSelectGroup}
          onOpenEvent={handleSelectEvent}
          onOpenOwnerReview={handleOpenOwnerReview}
          recentlyJoinedGroupName={
            workspace.groups.find((group) => group.id === recentlyJoinedGroupId)?.name ?? null
          }
          submittedOrdersByEvent={completedOrdersForDashboard}
        />
      ) : null}

      {currentRoute.key === "account" && session ? (
        <AccountScreen
          currentPassword={currentPassword}
          isChangingPassword={isChangingPassword}
          nextPassword={nextPassword}
          onCurrentPasswordChange={setCurrentPassword}
          onGroupOpen={handleSelectGroup}
          onLogout={handleLogout}
          onPasswordChange={handlePasswordChange}
          onNextPasswordChange={setNextPassword}
          session={session}
          workspace={workspace}
        />
      ) : null}

      {currentRoute.key === "groups" ? (
        <GroupScreen
          activeGroupName={activeGroup?.name}
          events={scopedEvents}
          justJoinedByInvitation={activeGroup?.id === recentlyJoinedGroupId}
          members={groupMembers}
          workspace={workspace}
          createEventTitle={createEventTitle}
          createEventDescription={createEventDescription}
          createEventVotingStartsAt={createEventVotingStartsAt}
          createEventVotingEndsAt={createEventVotingEndsAt}
          inviteQuery={inviteQuery}
          inviteResults={inviteResults}
          isInviteOpen={isInviteOpen}
          isInvitingMember={isInvitingMember}
          isCreatingEvent={isCreatingEvent}
          isLeavingGroup={isLeavingGroup}
          isSearchingUsers={isSearchingUsers}
          isTransferringOwner={isTransferringOwner}
          onCreateEvent={handleCreateEvent}
          onCreateEventDescriptionChange={setCreateEventDescription}
          onCreateEventTitleChange={setCreateEventTitle}
          onCreateEventVotingEndsAtChange={setCreateEventVotingEndsAt}
          onCreateEventVotingStartsAtChange={setCreateEventVotingStartsAt}
          onInviteMember={handleInviteMember}
          onInviteQueryChange={setInviteQuery}
          onLeaveGroup={handleLeaveGroup}
          onOpenEvent={handleSelectEvent}
          onOpenOwnerReview={handleOpenOwnerReview}
          onSearchInviteCandidates={handleSearchUsers}
          onToggleInviteOpen={() => setIsInviteOpen((current) => !current)}
          onTransferOwner={handleTransferOwner}
          selectedGroupId={activeGroup?.id}
          signedInUserId={session?.user.userId}
          submittedOrdersByEvent={submittedOrdersByEvent}
        />
      ) : null}

      {currentRoute.key === "events" ? (
        <EventScreen
          canManageVoting={canManageActiveGroup}
          workspace={workspace}
          createPhotoCaption={createPhotoCaption}
          createPhotoFileName={createPhotoFile?.name}
          createPhotoPreviewUrl={createPhotoPreviewUrl ?? undefined}
          isCreatingPhoto={isCreatingPhoto}
          isLikingPhoto={isLikingPhoto}
          onCloseVoting={handleCloseVoting}
          selectedEventId={activeEvent?.id}
          selectedGroupName={activeGroup?.name}
          workflow={workflow}
          onCreatePhoto={handleCreatePhoto}
          onCreatePhotoCaptionChange={setCreatePhotoCaption}
          onCreatePhotoFileChange={setCreatePhotoFile}
          onExtendVoting={handleExtendVoting}
          onLikePhoto={handleLikePhoto}
          submittedOrder={submittedOrdersByEvent[activeEventId]}
        />
      ) : null}

      {currentRoute.key === "albums" ? (
        canOpenOwnerSelection ? (
          <AlbumCandidateScreen
            workspace={workspace}
            review={review}
            orderEntry={orderEntry}
            workflow={workflow}
            activeGroupName={activeGroup?.name}
            activeEventName={activeEvent?.name}
            openedFromOwnerReview={ownerReviewEntryEventId === activeEventId}
            coverPhotoId={selectedCoverPhoto?.id}
            isOwnerApproved={isOwnerApproved}
            selectedPhotoIds={selectedPhotoIds}
            onSetCoverPhoto={handleSetCoverPhoto}
            onTogglePhotoSelection={handleTogglePhotoSelection}
            onOpenPlanner={handleOpenSpreadPlanner}
          />
        ) : (
          <StatePanel
            tone="empty"
            title={selectionLockState.title}
            description={selectionLockState.description}
          />
        )
      ) : null}

      {currentRoute.key === "spreads" ? (
        canOpenOwnerSelection ? (
          <SpreadPlannerScreen
            workspace={workspace}
            review={review}
            orderEntry={orderEntry}
            workflow={workflow}
            activeGroupName={activeGroup?.name}
            activeEventName={activeEvent?.name}
            openedFromOwnerReview={ownerReviewEntryEventId === activeEventId}
            coverPhotoId={spreadDraftCoverPhoto?.id}
            isOwnerApproved={spreadDraft?.ownerApproved ?? isOwnerApproved}
            pageLayouts={spreadDraft?.pageLayouts ?? orderEntry?.pagePlanner?.pageLayouts ?? {}}
            pageNotes={spreadDraft?.pageNotes ?? orderEntry?.pagePlanner?.pageNotes ?? {}}
            selectedPhotoIds={spreadDraftSelectedPhotoIds}
            pageAssignments={effectiveSpreadDraftAssignments}
            unassignedPhotos={unassignedSpreadDraftPhotos}
            onAssignPhotoToSlot={handleDraftAssignPhotoToSlot}
            onToggleOwnerApproval={handleDraftToggleOwnerApproval}
            onSetPageLayout={handleDraftSetPageLayout}
            onSetPageNote={handleDraftSetPageNote}
            onSetCoverPhoto={handleDraftSetCoverPhoto}
            onBack={() => navigateTo("albums")}
            onOpenOrder={() => void handleConfirmSpreadDraftAndOpenOrder()}
          />
        ) : (
          <StatePanel
            tone="empty"
            title={selectionLockState.title}
            description={selectionLockState.description}
          />
        )
      ) : null}

      {currentRoute.key === "orders" ? (
        canOpenOwnerSelection ? (
          <OrderHandoffScreen
            activeEventId={activeEventId}
            workspace={workspace}
            orderEntry={orderEntry}
            activeGroupName={activeGroup?.name}
            activeEventName={activeEvent?.name}
            coverPhotoCaption={selectedCoverPhoto?.caption}
            estimatedPageCount={review?.pagePreview.length}
            initialSubmitResult={submittedOrdersByEvent[activeEventId] ?? null}
            isOwnerApproved={isOwnerApproved}
            onSubmitSuccess={handleSubmitSuccess}
            pageLayouts={orderEntry?.pagePlanner?.pageLayouts ?? {}}
            pageNotes={orderEntry?.pagePlanner?.pageNotes ?? {}}
            selectedPhotoCount={selectedPhotos.length}
            selectedPhotoCaptions={selectedSpreadPhotos.map((photo) => photo.caption)}
            onBack={() => navigateTo("spreads")}
          />
        ) : (
          <StatePanel
            tone="empty"
            title={orderLockState.title}
            description={orderLockState.description}
          />
        )
      ) : null}

      {currentRoute.key !== "groups" &&
      currentRoute.key !== "events" &&
      currentRoute.key !== "albums" &&
      currentRoute.key !== "spreads" &&
      currentRoute.key !== "orders" &&
      currentRoute.key !== "login" ? (
        <PageSection
          eyebrow={currentRoute.requiresAuth ? "로그인 후 화면" : "공개 화면"}
          title={currentRoute.title}
          description={currentRoute.description}
        >
          <PrimaryAction label="워크스페이스 열기" />
          <StatePanel
            tone="empty"
            title="이 화면은 아직 정리 중입니다"
            description="로그인 후 접근하는 화면은 순서대로 다시 구성하고 있습니다."
          />
        </PageSection>
      ) : null}
    </main>
  );
}

function getDefaultVotingStartInput(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  return toDateTimeLocalValue(now);
}

function getDefaultVotingEndInput(): string {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setMinutes(0, 0, 0);
  return toDateTimeLocalValue(nextWeek);
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDateTime(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  return new Date(normalized).toISOString();
}

function resolveWorkspaceSlice<T>(
  eventId: string,
  resolver: () => T,
): T | undefined {
  if (!eventId) {
    return undefined;
  }

  try {
    return resolver();
  } catch {
    return undefined;
  }
}

function getSelectionLockState(
  operationStage: "setup" | "voting" | "owner_review" | undefined,
  canManageActiveGroup: boolean | undefined,
): {
  title: string;
  description: string;
} {
  if (!canManageActiveGroup) {
    return {
      title: "오너 선택은 그룹 오너만 할 수 있습니다",
      description: "투표가 끝난 뒤 사진을 고르고 SweetBook 작업으로 넘기는 단계는 그룹 오너만 진행할 수 있습니다.",
    };
  }

  if (operationStage === "setup") {
    return {
      title: "투표를 시작하고 마쳐야 오너 선택이 열립니다",
      description: "이 이벤트는 아직 준비 단계입니다. 먼저 투표를 열고 반응을 모은 뒤, 투표를 마치면 오너 선택 화면이 열립니다.",
    };
  }

  if (operationStage === "voting") {
    return {
      title: "투표가 끝나면 오너 선택이 열립니다",
      description: "이 이벤트는 아직 투표 중입니다. 투표 기간이 끝나거나 오너가 마감하면 오너 선택 화면이 열립니다.",
    };
  }

  return {
    title: "오너 선택은 이벤트 상태를 기다리는 중입니다",
    description: "이 이벤트는 아직 오너 사진 선택을 시작할 준비가 되지 않았습니다.",
  };
}

function getOrderLockState(
  operationStage: "setup" | "voting" | "owner_review" | undefined,
  canManageActiveGroup: boolean | undefined,
): {
  title: string;
  description: string;
} {
  if (!canManageActiveGroup) {
    return {
      title: "주문 전달은 그룹 오너만 할 수 있습니다",
      description: "최종 초안을 검토하고 SweetBook 주문 단계로 넘기는 작업은 그룹 오너만 할 수 있습니다.",
    };
  }

  if (operationStage === "setup") {
    return {
      title: "투표가 끝나기 전까지 주문 전달은 잠겨 있습니다",
      description: "이 이벤트는 아직 준비 단계입니다. 투표를 열고, 투표가 끝난 뒤 오너 선택까지 마쳐야 SweetBook 주문 전달이 열립니다.",
    };
  }

  if (operationStage === "voting") {
    return {
      title: "투표가 열려 있는 동안에는 주문 전달이 잠겨 있습니다",
      description: "투표를 마치고 오너 선택까지 끝나야 SweetBook 주문 전달이 가능합니다.",
    };
  }

  return {
    title: "주문 전달은 이벤트 상태를 기다리는 중입니다",
    description: "이 이벤트는 아직 SweetBook 주문 단계로 넘어갈 준비가 되지 않았습니다.",
  };
}

function isVotingClosingSoon(value?: string): boolean {
  if (!value) {
    return false;
  }

  const endsAt = new Date(value);
  if (Number.isNaN(endsAt.valueOf())) {
    return false;
  }

  const diffMs = endsAt.valueOf() - Date.now();
  const fortyEightHours = 1000 * 60 * 60 * 48;

  return diffMs > 0 && diffMs <= fortyEightHours;
}

function formatNotificationDate(value?: string): string {
  if (!value) {
    return "留덇컧 ?쒓컖";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getOperationStage(
  event: PrototypeWorkspaceViewModel["events"][number],
): "setup" | "voting" | "owner_review" {
  if (event.operationSummary?.stage) {
    return event.operationSummary.stage;
  }

  if (event.canOwnerSelectPhotos || event.status === "ready") {
    return "owner_review";
  }

  if (event.canVote || event.status === "collecting") {
    return "voting";
  }

  return "setup";
}
