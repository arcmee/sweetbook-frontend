import { type ChangeEvent, type FormEvent, type ReactElement } from "react";

import type {
  EventCardViewModel,
  PrototypeGroupMemberViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type GroupSubmittedOrderSummary = {
  bookUid: string;
  orderStatusDisplay?: string | null;
  orderUid: string;
};

type GroupScreenProps = {
  activeGroupName?: string;
  events: EventCardViewModel[];
  inviteQuery?: string;
  inviteResults?: Array<{ userId: string; username: string; displayName: string }>;
  isInviteOpen?: boolean;
  isInvitingMember?: boolean;
  justJoinedByInvitation?: boolean;
  members: PrototypeGroupMemberViewModel[];
  workspace: PrototypeWorkspaceViewModel;
  createEventTitle?: string;
  createEventDescription?: string;
  createEventVotingStartsAt?: string;
  createEventVotingEndsAt?: string;
  isCreatingEvent?: boolean;
  isLeavingGroup?: boolean;
  isSearchingUsers?: boolean;
  isTransferringOwner?: boolean;
  onCreateEvent?: () => void | Promise<void>;
  onCreateEventDescriptionChange?: (value: string) => void;
  onCreateEventTitleChange?: (value: string) => void;
  onCreateEventVotingStartsAtChange?: (value: string) => void;
  onCreateEventVotingEndsAtChange?: (value: string) => void;
  onInviteMember?: (userId: string) => void | Promise<void>;
  onInviteQueryChange?: (value: string) => void;
  onLeaveGroup?: () => void | Promise<void>;
  onOpenEvent?: (eventId: string) => void;
  onOpenOwnerReview?: (eventId: string) => void;
  onSearchInviteCandidates?: () => void | Promise<void>;
  onToggleInviteOpen?: () => void;
  onTransferOwner?: (userId: string) => void | Promise<void>;
  selectedGroupId?: string;
  signedInUserId?: string;
  submittedOrdersByEvent?: Record<string, GroupSubmittedOrderSummary>;
};

export function GroupScreen({
  activeGroupName,
  events,
  inviteQuery = "",
  inviteResults = [],
  isInviteOpen = false,
  isInvitingMember = false,
  justJoinedByInvitation = false,
  members,
  workspace,
  createEventTitle = "",
  createEventDescription = "",
  createEventVotingStartsAt = "",
  createEventVotingEndsAt = "",
  isCreatingEvent = false,
  isLeavingGroup = false,
  isSearchingUsers = false,
  isTransferringOwner = false,
  onCreateEvent,
  onCreateEventDescriptionChange,
  onCreateEventTitleChange,
  onCreateEventVotingStartsAtChange,
  onCreateEventVotingEndsAtChange,
  onInviteMember,
  onInviteQueryChange,
  onLeaveGroup,
  onOpenEvent,
  onOpenOwnerReview,
  onSearchInviteCandidates,
  onToggleInviteOpen,
  onTransferOwner,
  selectedGroupId,
  signedInUserId,
  submittedOrdersByEvent = {},
}: GroupScreenProps): ReactElement {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreateEvent?.();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreateEventTitleChange?.(event.target.value);
  }

  function handleDescriptionChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    onCreateEventDescriptionChange?.(event.target.value);
  }

  const activeMembership = members.find((member) => member.userId === signedInUserId);
  const canManageMembers = activeMembership?.role === "Owner";
  const canLeaveGroup = activeMembership?.role !== "Owner";
  const completedEvents = events.filter((event) => submittedOrdersByEvent[event.id]);
  const shouldShowEmptyInviteResults =
    isInviteOpen &&
    inviteQuery.trim().length > 0 &&
    !isSearchingUsers &&
    inviteResults.length === 0;

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="그룹"
        title={activeGroupName ?? "그룹 페이지"}
        description="이 그룹의 이벤트와 멤버를 관리하고, 초대와 SweetBook 작업 흐름을 확인합니다."
      >
        <div className="grid gap-2 text-sm text-slate-700">
          <p>현재 워크스페이스에는 그룹 {workspace.groupSummary.totalGroups}개가 있습니다.</p>
          <p>이 그룹에는 이벤트 {events.length}개와 멤버 {members.length}명이 연결되어 있습니다.</p>
          <p>
            {selectedGroupId
              ? "현재 선택한 그룹을 기준으로 작업 중입니다."
              : "메인 화면에서 그룹을 선택하면 이 페이지에서 작업을 이어갈 수 있습니다."}
          </p>
        </div>

        {justJoinedByInvitation ? (
          <StatePanel
            tone="success"
            title="초대로 그룹에 참여했습니다"
            description="이제 이벤트 목록을 보고 사진 업로드나 투표를 바로 시작할 수 있습니다."
          />
        ) : null}
      </PageSection>

      <PageSection
        eyebrow="이벤트"
        title="새 이벤트 만들기"
        description="제목, 설명, 투표 시작 시각과 종료 시각을 입력한 뒤 이 그룹의 새 이벤트를 만듭니다."
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            이벤트 제목
            <input
              name="eventTitle"
              value={createEventTitle}
              onChange={handleNameChange}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="예: 봄 소풍"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            이벤트 설명
            <textarea
              name="eventDescription"
              value={createEventDescription}
              onChange={handleDescriptionChange}
              className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="이 이벤트에서 어떤 사진을 모을지 간단히 적어주세요."
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            투표 시작 시각
            <input
              name="eventVotingStartsAt"
              type="datetime-local"
              value={createEventVotingStartsAt}
              onChange={(event) => onCreateEventVotingStartsAtChange?.(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            투표 종료 시각
            <input
              name="eventVotingEndsAt"
              type="datetime-local"
              value={createEventVotingEndsAt}
              onChange={(event) => onCreateEventVotingEndsAtChange?.(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
            />
          </label>

          <div className="md:col-span-2">
            <PrimaryAction
              label={isCreatingEvent ? "이벤트 생성 중..." : "이 그룹에 이벤트 만들기"}
              disabled={
                isCreatingEvent ||
                createEventTitle.trim().length === 0 ||
                createEventDescription.trim().length === 0 ||
                createEventVotingStartsAt.trim().length === 0 ||
                createEventVotingEndsAt.trim().length === 0
              }
              type="submit"
            />
          </div>
        </form>
      </PageSection>

      <PageSection
        eyebrow="이벤트 목록"
        title="이 그룹의 이벤트"
        description="이벤트를 열어 사진 업로드와 투표를 확인하고, 준비가 끝난 이벤트는 SweetBook 작업으로 이어집니다."
      >
        {events.length > 0 ? (
          <ul className="grid gap-4">
            {events.map((event) => {
              const isCompleted = Boolean(submittedOrdersByEvent[event.id]);

              return (
                <li
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid gap-2">
                      <strong className="text-lg font-semibold text-slate-950">{event.name}</strong>
                      <p className="text-sm font-medium text-teal-700">
                        사진 업로드와 투표를 보려면 이벤트 페이지로 이동하세요.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenEvent?.(event.id)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-100"
                    >
                      이벤트 페이지 열기
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{event.description}</p>
                  <div className="mt-3 grid gap-1 text-sm text-slate-700">
                    <p>상태: {event.status}</p>
                    <p>사진 수: {event.photoCount}장</p>
                    <p>투표 기간: {formatVotingWindow(event.votingStartsAt, event.votingEndsAt)}</p>
                    <p>SweetBook 흐름: {getEventFlowStatus(event, isCompleted)}</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{getEventManagementHint(event)}</p>

                  {isCompleted ? (
                    <StatePanel
                      tone="success"
                      title="SweetBook 작업 완료"
                      description={`주문 ${submittedOrdersByEvent[event.id]?.orderUid}가 책 ${submittedOrdersByEvent[event.id]?.bookUid}로 완료되었습니다.`}
                    />
                  ) : null}

                  {event.operationSummary?.stage === "owner_review" && !isCompleted ? (
                    <div className="mt-4">
                      <PrimaryAction
                        label="SweetBook 작업 열기"
                        onClick={() => onOpenOwnerReview?.(event.id)}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <StatePanel
            tone="empty"
            title="아직 이벤트가 없습니다"
            description="위의 입력 폼으로 첫 이벤트를 만들면 이곳에 목록이 표시됩니다."
          />
        )}
      </PageSection>

      <PageSection
        eyebrow="멤버"
        title="그룹 구성원"
        description="멤버를 초대하고 역할을 확인하며, 오너는 필요하면 권한 위임을 진행할 수 있습니다."
      >
        <ul className="grid gap-3">
          {members.map((member) => (
            <li
              key={member.userId}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong className="text-base font-semibold text-slate-950">
                    {member.displayName}
                  </strong>
                  <p className="mt-1 text-sm text-slate-600">
                    {member.userId} · 역할 {member.role}
                  </p>
                </div>
                {canManageMembers && member.userId !== signedInUserId ? (
                  <PrimaryAction
                    label={isTransferringOwner ? "오너 위임 중..." : "오너 위임"}
                    disabled={isTransferringOwner}
                    onClick={() => void onTransferOwner?.(member.userId)}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <PrimaryAction
            label={isInviteOpen ? "초대 창 닫기" : "ID로 멤버 초대"}
            onClick={onToggleInviteOpen}
          />
          <PrimaryAction
            label={isLeavingGroup ? "그룹 탈퇴 중..." : "그룹 탈퇴"}
            disabled={!canLeaveGroup || isLeavingGroup}
            onClick={() => void onLeaveGroup?.()}
          />
        </div>

        {!canLeaveGroup ? (
          <p className="text-sm text-slate-600">
            오너는 먼저 다른 멤버에게 권한을 위임해야 그룹을 탈퇴할 수 있습니다.
          </p>
        ) : null}

        {isInviteOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onSearchInviteCandidates?.();
            }}
            className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              멤버 ID 검색
              <input
                name="inviteQuery"
                value={inviteQuery}
                onChange={(event) => onInviteQueryChange?.(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                placeholder="아이디, 사용자 ID, 표시 이름으로 검색"
              />
            </label>

            <div>
              <PrimaryAction
                label={isSearchingUsers ? "검색 중..." : "멤버 검색"}
                disabled={isSearchingUsers || inviteQuery.trim().length === 0}
                type="submit"
              />
            </div>

            {isSearchingUsers ? (
              <StatePanel
                tone="loading"
                title="검색 중입니다"
                description="입력한 조건과 일치하는 사용자를 찾고 있습니다."
              />
            ) : null}

            {shouldShowEmptyInviteResults ? (
              <StatePanel
                tone="empty"
                title="검색 결과가 없습니다"
                description="입력한 아이디나 이름과 일치하는 사용자가 없습니다."
              />
            ) : null}

            {inviteResults.length > 0 ? (
              <ul className="grid gap-3">
                {inviteResults.map((result) => (
                  <li
                    key={result.userId}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <strong className="text-base font-semibold text-slate-950">
                      {result.displayName}
                    </strong>
                    <p className="mt-1 text-sm text-slate-600">
                      @{result.username} · {result.userId}
                    </p>
                    <div className="mt-4">
                      <PrimaryAction
                        label={isInvitingMember ? "초대 중..." : "초대하기"}
                        disabled={isInvitingMember}
                        onClick={() => void onInviteMember?.(result.userId)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>
        ) : null}
      </PageSection>
    </div>
  );
}

function formatVotingWindow(votingStartsAt?: string, votingEndsAt?: string): string {
  if (!votingStartsAt || !votingEndsAt) {
    return "아직 투표 일정이 없습니다";
  }

  return `${formatVotingDate(votingStartsAt)} ~ ${formatVotingDate(votingEndsAt)}`;
}

function formatVotingDate(value?: string): string {
  if (!value) {
    return "미정";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getEventManagementHint(event: EventCardViewModel): string {
  if (event.operationSummary?.stage === "owner_review") {
    return "투표가 끝났고, 오너가 사진을 고른 뒤 SweetBook 작업으로 이어갈 수 있습니다.";
  }

  if (event.operationSummary?.stage === "voting") {
    return "구성원들이 사진을 올리고 좋아요를 남기는 투표 단계입니다.";
  }

  return "아직 투표를 시작하기 전 단계입니다.";
}

function getEventFlowStatus(event: EventCardViewModel, isCompleted: boolean): string {
  if (isCompleted) {
    return "작업이 완료되어 보관되었습니다.";
  }

  if (event.operationSummary?.stage === "owner_review") {
    return "오너 검토와 SweetBook 전달을 기다리는 상태입니다.";
  }

  if (event.operationSummary?.stage === "voting") {
    return "투표를 모으는 중이며, 이후 오너 검토가 열립니다.";
  }

  return "투표를 열기 전 준비 단계입니다.";
}
