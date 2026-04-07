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
  requestPrototypeEventVotingClose,
  requestPrototypeEventVotingExtend,
  requestPrototypeAuthLogout,
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
import { AlbumCandidateScreen } from "./screens/album-candidate-screen";
import { DashboardScreen } from "./screens/dashboard-screen";
import { EventScreen } from "./screens/event-screen";
import { GroupScreen } from "./screens/group-screen";
import { LoginScreen } from "./screens/login-screen";
import { OrderHandoffScreen } from "./screens/order-handoff-screen";
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
  const [selectedPhotoIdsByEvent, setSelectedPhotoIdsByEvent] = useState<
    Record<string, string[]>
  >({});
  const [coverPhotoIdByEvent, setCoverPhotoIdByEvent] = useState<Record<string, string>>({});
  const [pageLayoutByEvent, setPageLayoutByEvent] = useState<
    Record<string, Record<string, string>>
  >({});
  const [pageNotesByEvent, setPageNotesByEvent] = useState<
    Record<string, Record<string, string>>
  >({});
  const [ownerApprovalByEvent, setOwnerApprovalByEvent] = useState<Record<string, boolean>>(
    {},
  );
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

    if (window.location.pathname === "/") {
      window.history.replaceState({}, "", getRouteByKey(activeRouteKey).path);
    }
  }, [activeRouteKey]);

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
      const snapshot = await fetchPrototypeWorkspaceSnapshot();
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
      setSelectedPhotoIdsByEvent({});
      setCoverPhotoIdByEvent({});
      setPageLayoutByEvent({});
      setPageNotesByEvent({});
      setOwnerApprovalByEvent({});
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
      return;
    }

    void refreshWorkspace();
  }, [session]);

  useEffect(() => {
    if (!activeEventId || !review) {
      return;
    }

    setSelectedPhotoIdsByEvent((current) => {
      if (current[activeEventId]) {
        return current;
      }

      return {
        ...current,
        [activeEventId]: review.candidates.map((candidate) => candidate.photoId),
      };
    });
  }, [activeEventId, review]);

  useEffect(() => {
    if (!activeEventId) {
      return;
    }

    const selectedIds = selectedPhotoIdsByEvent[activeEventId] ?? [];
    if (selectedIds.length === 0) {
      return;
    }

    setCoverPhotoIdByEvent((current) => {
      const currentCoverId = current[activeEventId];
      if (currentCoverId && selectedIds.includes(currentCoverId)) {
        return current;
      }

      return {
        ...current,
        [activeEventId]: selectedIds[0],
      };
    });
  }, [activeEventId, selectedPhotoIdsByEvent]);

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
      setWorkspaceError("A group name is required.");
      return;
    }

    try {
      setIsCreatingGroup(true);
      setWorkspaceSuccess(null);
      await requestPrototypeGroupCreate({
        name: nextGroupName,
      });
      await refreshWorkspace();
      setCreateGroupName("");
      setWorkspaceSuccess(`Created group ${nextGroupName}.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingGroup(false);
    }
  }

  async function handleCreateEvent(): Promise<void> {
    const targetGroup = activeGroup;
    if (!targetGroup) {
      setWorkspaceError("A group is required before creating a prototype event.");
      return;
    }

    const nextEventTitle = createEventTitle.trim();
    const nextEventDescription = createEventDescription.trim();
    if (!nextEventTitle) {
      setWorkspaceError("An event title is required.");
      return;
    }
    if (!nextEventDescription) {
      setWorkspaceError("An event description is required.");
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
      setWorkspaceSuccess(`Created event ${nextEventTitle}.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreatingEvent(false);
    }
  }

  async function handleCreatePhoto(): Promise<void> {
    if (!activeEvent) {
      setWorkspaceError("An event is required before adding a prototype photo.");
      return;
    }

    const nextCaption = createPhotoCaption.trim();
    if (!nextCaption) {
      setWorkspaceError("A photo caption is required.");
      return;
    }
    if (!createPhotoFile) {
      setWorkspaceError("A photo file is required.");
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
      setWorkspaceSuccess(`Uploaded photo ${nextCaption}.`);
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
      await requestPrototypePhotoLike({
        photoId,
        userId: "user-demo",
      });
      await refreshWorkspace();
      setWorkspaceSuccess("Saved photo like.");
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
      setWorkspaceSuccess(`Closed voting for ${activeEvent.name}.`);
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
      setWorkspaceSuccess(`Extended voting for ${activeEvent.name}.`);
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
      setWorkspaceSuccess(`Invited ${userId} to ${activeGroup.name}.`);
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
      setWorkspaceSuccess(`Joined ${groupName}.`);
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
      setWorkspaceSuccess(`Declined invitation to ${groupName}.`);
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
      setWorkspaceSuccess(`Transferred owner role to ${nextOwnerUserId}.`);
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

    try {
      setIsLeavingGroup(true);
      await requestPrototypeGroupLeave({
        groupId: activeGroup.id,
        userId: session.user.userId,
      });
      await refreshWorkspace();
      setWorkspaceSuccess(`Left ${activeGroup.name}.`);
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLeavingGroup(false);
    }
  }

  async function handlePasswordChange(): Promise<void> {
    if (!currentPassword.trim() || !nextPassword.trim()) {
      setWorkspaceError("Current and next passwords are required.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await requestPrototypePasswordChange({
        currentPassword,
        nextPassword,
      });
      setCurrentPassword("");
      setNextPassword("");
      setWorkspaceSuccess("Updated your prototype password.");
    } catch (error: unknown) {
      setWorkspaceError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsChangingPassword(false);
    }
  }

  function handleTogglePhotoSelection(photoId: string): void {
    if (!activeEventId) {
      return;
    }

    setSelectedPhotoIdsByEvent((current) => {
      const existing = current[activeEventId] ?? [];
      const nextSelection = existing.includes(photoId)
        ? existing.filter((id) => id !== photoId)
        : [...existing, photoId];

      setCoverPhotoIdByEvent((currentCoverState) => {
        const currentCoverId = currentCoverState[activeEventId];
        if (!nextSelection.includes(currentCoverId)) {
          const nextCoverId = nextSelection[0];
          if (!nextCoverId) {
            const { [activeEventId]: _removed, ...rest } = currentCoverState;
            return rest;
          }

          return {
            ...currentCoverState,
            [activeEventId]: nextCoverId,
          };
        }

        return currentCoverState;
      });

      return {
        ...current,
        [activeEventId]: nextSelection,
      };
    });
    setWorkspaceSuccess("Updated owner album selection.");
  }

  function handleSetCoverPhoto(photoId: string): void {
    if (!activeEventId) {
      return;
    }

    setCoverPhotoIdByEvent((current) => ({
      ...current,
      [activeEventId]: photoId,
    }));
    setWorkspaceSuccess("Updated album cover selection.");
  }

  function handleSetPageLayout(pageId: string, layout: string): void {
    if (!activeEventId) {
      return;
    }

    setPageLayoutByEvent((current) => ({
      ...current,
      [activeEventId]: {
        ...(current[activeEventId] ?? {}),
        [pageId]: layout,
      },
    }));
    setWorkspaceSuccess("Updated draft page layout.");
  }

  function handleSetPageNote(pageId: string, note: string): void {
    if (!activeEventId) {
      return;
    }

    setPageNotesByEvent((current) => ({
      ...current,
      [activeEventId]: {
        ...(current[activeEventId] ?? {}),
        [pageId]: note,
      },
    }));
    setWorkspaceSuccess("Updated draft page note.");
  }

  function handleToggleOwnerApproval(): void {
    if (!activeEventId) {
      return;
    }

    const isApproved = ownerApprovalByEvent[activeEventId] ?? false;
    setOwnerApprovalByEvent((current) => ({
      ...current,
      [activeEventId]: !isApproved,
    }));
    setWorkspaceSuccess(
      isApproved
        ? "Removed owner approval from the draft."
        : "Recorded owner approval for the draft.",
    );
  }

  function moveSelectedPhoto(photoId: string, direction: -1 | 1): void {
    if (!activeEventId) {
      return;
    }

    setSelectedPhotoIdsByEvent((current) => {
      const existing = current[activeEventId] ?? [];
      const coverId = coverPhotoIdByEvent[activeEventId] ?? existing[0];
      const spreadIds = existing.filter((id) => id !== coverId);
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
        [activeEventId]: coverId ? [coverId, ...nextSpreadIds] : nextSpreadIds,
      };
    });
    setWorkspaceSuccess(
      direction < 0 ? "Moved selected spread earlier." : "Moved selected spread later.",
    );
  }

  function handleSelectGroup(groupId: string): void {
    setSelectedGroupId(groupId);
    setRecentlyJoinedGroupId((current) => (current === groupId ? current : null));
    const nextGroup = workspace.groups.find((group) => group.id === groupId);
    const nextEvent = workspace.events.find((event) => event.groupName === nextGroup?.name);
    setSelectedEventId(nextEvent?.id ?? null);
    navigateTo("groups");
  }

  function handleSelectEvent(eventId: string): void {
    setSelectedEventId(eventId);
    const nextEvent = workspace.events.find((event) => event.id === eventId);
    const nextGroup = workspace.groups.find((group) => group.name === nextEvent?.groupName);
    if (nextGroup) {
      setSelectedGroupId(nextGroup.id);
    }
    navigateTo("events");
  }

  const selectedPhotoIds = selectedPhotoIdsByEvent[activeEventId] ?? [];
  const selectedPhotos =
    workflow?.photos.filter((photo) => selectedPhotoIds.includes(photo.id)) ?? [];
  const selectedCoverPhoto =
    selectedPhotos.find((photo) => photo.id === coverPhotoIdByEvent[activeEventId]) ??
    selectedPhotos[0];
  const selectedSpreadPhotos = selectedPhotos.filter(
    (photo) => photo.id !== selectedCoverPhoto?.id,
  );
  const canOpenOwnerSelection =
    canManageActiveGroup &&
    activeEvent?.status === "ready" &&
    Boolean(activeEvent?.canOwnerSelectPhotos);
  const selectionLockState = getSelectionLockState(activeEvent?.status, canManageActiveGroup);
  const orderLockState = getOrderLockState(activeEvent?.status, canManageActiveGroup);
  const myGroups = workspace.groups;
  const voteNotifications: NotificationActionViewModel[] = workspace.events
    .filter((event) => event.canVote)
    .filter((event) => {
      const eventWorkflow = resolveWorkspaceSlice(event.id, () =>
        getPrototypePhotoWorkflowViewModel(event.id, workspaceSnapshot),
      );

      return !eventWorkflow?.photos.some((photo) => photo.likedByViewer);
    })
    .map((event) => ({
      id: `vote-${event.id}`,
      message: `You still need to vote in ${event.name}.`,
      primaryActionLabel: "Open event",
      onPrimaryAction: () => handleSelectEvent(event.id),
    }));
  const invitationNotifications: NotificationActionViewModel[] = (
    workspaceSnapshot.pendingInvitations ?? []
  ).map(
    (invitation) => ({
      id: invitation.invitationId,
      message: `${invitation.invitedByDisplayName} invited you to join ${invitation.groupName}.`,
      primaryActionLabel: isResolvingInvitation ? "Accepting..." : "Accept invite",
      onPrimaryAction: () =>
        handleAcceptInvitation(invitation.invitationId, invitation.groupName),
      secondaryActionLabel: isResolvingInvitation ? "Declining..." : "Decline",
      onSecondaryAction: () =>
        handleDeclineInvitation(invitation.invitationId, invitation.groupName),
    }),
  );
  const notifications = [...invitationNotifications, ...voteNotifications];
  const notificationGroups = [
    {
      title: "Group invitations",
      emptyMessage: "No pending invitations right now.",
      items: invitationNotifications,
    },
    {
      title: "Voting reminders",
      emptyMessage: "No voting reminders right now.",
      items: voteNotifications,
    },
  ];
  const dashboardActions = [
    ...invitationNotifications.map((notification) => ({
      id: `dashboard-${notification.id}`,
      title: "Review a group invitation",
      description: notification.message,
      ctaLabel: notification.primaryActionLabel,
      onCta: () => void notification.onPrimaryAction(),
    })),
    ...voteNotifications.map((notification) => ({
      id: `dashboard-${notification.id}`,
      title: "Vote in an active event",
      description: notification.message,
      ctaLabel: notification.primaryActionLabel,
      onCta: () => void notification.onPrimaryAction(),
    })),
    ...(recentlyJoinedGroupId
      ? [
          {
            id: `joined-${recentlyJoinedGroupId}`,
            title: "Continue with your newly joined group",
            description: `Review ${activeGroup?.id === recentlyJoinedGroupId ? activeGroup.name : workspace.groups.find((group) => group.id === recentlyJoinedGroupId)?.name ?? "your group"} and check which event needs your vote next.`,
            ctaLabel: "Open group page",
            onCta: () => handleSelectGroup(recentlyJoinedGroupId),
          },
        ]
      : []),
  ];

  function navigateTo(routeKey: AppRouteKey): void {
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
          title="Restoring prototype session"
          description="Checking the saved prototype login before opening protected routes."
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

  return (
    <main>
      <header>
        <p>Prototype workspace</p>
        <h1>SweetBook</h1>
        <p>App shell, route boundaries, and shared UI foundation.</p>
        {session ? <p>Signed in as {session.user.displayName}</p> : null}
        {session ? (
          <section aria-label="Account panel">
            <h2>Account</h2>
            <p>{session.user.displayName}</p>
            <p>@{session.user.username}</p>
            <p>Role: {session.user.role}</p>
            <h3>My groups</h3>
            <p>{myGroups.length} groups you can open from anywhere in the workspace.</p>
            <ul>
              {myGroups.map((group) => (
                <li key={group.id}>
                  <button type="button" onClick={() => handleSelectGroup(group.id)}>
                    {group.name}
                  </button>
                </li>
              ))}
            </ul>
            <h3>Notification center</h3>
            <p>{notifications.length} active</p>
            {notificationGroups.map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h4>{group.title}</h4>
                {group.items.length > 0 ? (
                  <ul>
                    {group.items.map((notification) => (
                      <li key={notification.id}>
                        <span>{notification.message}</span>
                        <button type="button" onClick={() => void notification.onPrimaryAction()}>
                          {notification.primaryActionLabel}
                        </button>
                        {notification.secondaryActionLabel && notification.onSecondaryAction ? (
                          <button
                            type="button"
                            onClick={() => void notification.onSecondaryAction?.()}
                          >
                            {notification.secondaryActionLabel}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{group.emptyMessage}</p>
                )}
              </section>
            ))}
            <h3>Change password</h3>
            <p>Use a simple prototype password change flow from the account panel.</p>
            <label>
              Current password
              <input
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label>
              Next password
              <input
                name="nextPassword"
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
              />
            </label>
            <PrimaryAction
              label={isChangingPassword ? "Saving password..." : "Change password"}
              disabled={isChangingPassword}
              onClick={handlePasswordChange}
            />
          </section>
        ) : null}
      </header>

      <nav aria-label="Primary navigation">
        <ul>
          {appRoutes
            .filter((route) => route.showInNavigation)
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

      {session ? <PrimaryAction label="Sign out" onClick={handleLogout} /> : null}

      {workspacePending ? (
        <StatePanel
          tone="loading"
          title="Refreshing workspace"
          description="Loading the latest prototype workspace snapshot from the backend."
        />
      ) : null}
      {workspaceError ? (
        <StatePanel
          tone="error"
          title="Workspace refresh failed"
          description={workspaceError}
        />
      ) : null}
      {workspaceSuccess ? (
        <StatePanel
          tone="success"
          title="Workspace updated"
          description={workspaceSuccess}
        />
      ) : null}

      {currentRoute.key === "login" ? (
        <LoginScreen onLogin={handleLogin} />
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
          recentlyJoinedGroupName={
            workspace.groups.find((group) => group.id === recentlyJoinedGroupId)?.name ?? null
          }
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
          onSearchInviteCandidates={handleSearchUsers}
          onToggleInviteOpen={() => setIsInviteOpen((current) => !current)}
          onTransferOwner={handleTransferOwner}
          selectedGroupId={activeGroup?.id}
          signedInUserId={session?.user.userId}
        />
      ) : null}

      {currentRoute.key === "events" ? (
        <EventScreen
          canManageVoting={canManageActiveGroup}
          workspace={workspace}
          createPhotoCaption={createPhotoCaption}
          createPhotoFileName={createPhotoFile?.name}
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
        />
      ) : null}

      {currentRoute.key === "albums" ? (
        canOpenOwnerSelection ? (
          <AlbumCandidateScreen
            workspace={workspace}
            review={review}
            workflow={workflow}
            activeGroupName={activeGroup?.name}
            activeEventName={activeEvent?.name}
            coverPhotoId={selectedCoverPhoto?.id}
            isOwnerApproved={ownerApprovalByEvent[activeEventId] ?? false}
            pageLayouts={pageLayoutByEvent[activeEventId] ?? {}}
            pageNotes={pageNotesByEvent[activeEventId] ?? {}}
            onMovePhotoEarlier={(photoId) => moveSelectedPhoto(photoId, -1)}
            onMovePhotoLater={(photoId) => moveSelectedPhoto(photoId, 1)}
            selectedPhotoIds={selectedPhotoIds}
            onToggleOwnerApproval={handleToggleOwnerApproval}
            onSetPageLayout={handleSetPageLayout}
            onSetPageNote={handleSetPageNote}
            onSetCoverPhoto={handleSetCoverPhoto}
            onTogglePhotoSelection={handleTogglePhotoSelection}
            onOpenOrder={() => navigateTo("orders")}
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
            workspace={workspace}
            orderEntry={orderEntry}
            activeGroupName={activeGroup?.name}
            activeEventName={activeEvent?.name}
            coverPhotoCaption={selectedCoverPhoto?.caption}
            estimatedPageCount={review?.pagePreview.length}
            isOwnerApproved={ownerApprovalByEvent[activeEventId] ?? false}
            pageLayouts={pageLayoutByEvent[activeEventId] ?? {}}
            pageNotes={pageNotesByEvent[activeEventId] ?? {}}
            selectedPhotoCount={selectedPhotos.length}
            selectedPhotoCaptions={selectedSpreadPhotos.map((photo) => photo.caption)}
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
      currentRoute.key !== "orders" &&
      currentRoute.key !== "login" ? (
        <PageSection
          eyebrow={currentRoute.requiresAuth ? "Authenticated route" : "Public route"}
          title={currentRoute.title}
          description={currentRoute.description}
        >
          <PrimaryAction label="Open workspace" />
          <StatePanel
            tone="empty"
            title="Feature content arrives in later tasks"
            description="Authenticated routes stay behind the login boundary."
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
  eventStatus: PrototypeWorkspaceSnapshot["workspace"]["events"][number]["status"] | undefined,
  canManageActiveGroup: boolean | undefined,
): {
  title: string;
  description: string;
} {
  if (!canManageActiveGroup) {
    return {
      title: "Owner selection is only available to the group owner",
      description: "Only the group owner can move from voting into the final SweetBook photo selection stage.",
    };
  }

  if (eventStatus === "draft") {
    return {
      title: "Owner selection opens after voting starts and finishes",
      description: "This event is still in draft setup. Open voting first, collect reactions, and then finish voting before the owner selection page becomes available.",
    };
  }

  if (eventStatus === "collecting") {
    return {
      title: "Owner selection opens after voting ends",
      description: "Voting is still running for this event. Close or finish the voting window before the owner selection page becomes available.",
    };
  }

  return {
    title: "Owner selection is waiting on the event state",
    description: "This event is not yet ready for owner photo selection.",
  };
}

function getOrderLockState(
  eventStatus: PrototypeWorkspaceSnapshot["workspace"]["events"][number]["status"] | undefined,
  canManageActiveGroup: boolean | undefined,
): {
  title: string;
  description: string;
} {
  if (!canManageActiveGroup) {
    return {
      title: "Order handoff is only available to the group owner",
      description: "Only the group owner can review the final draft and continue into the SweetBook handoff flow.",
    };
  }

  if (eventStatus === "draft") {
    return {
      title: "Order handoff stays locked until voting is complete",
      description: "This event is still in draft setup. Start voting, finish the collection window, and then complete owner selection before the SweetBook handoff opens.",
    };
  }

  if (eventStatus === "collecting") {
    return {
      title: "Order handoff is locked while voting is still open",
      description: "Finish voting and complete owner selection before the SweetBook order handoff becomes available.",
    };
  }

  return {
    title: "Order handoff is waiting on the event state",
    description: "This event is not yet ready for the SweetBook handoff stage.",
  };
}
