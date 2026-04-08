import type { ChangeEvent, FormEvent, ReactElement } from "react";

import type {
  PrototypeDashboardGroupViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type DashboardSubmittedOrderSummary = {
  bookUid: string;
  groupId: string;
  groupName: string;
  orderStatusDisplay?: string | null;
  orderUid: string;
};

type DashboardActionViewModel = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
};

type DashboardScreenProps = {
  createGroupName?: string;
  groupedEvents: PrototypeDashboardGroupViewModel[];
  isCreatingGroup?: boolean;
  nextActions?: DashboardActionViewModel[];
  onCreateGroup?: () => void | Promise<void>;
  onCreateGroupNameChange?: (value: string) => void;
  onOpenGroup?: (groupId: string) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenOwnerReview?: (eventId: string) => void;
  recentlyJoinedGroupName?: string | null;
  submittedOrdersByEvent?: Record<string, DashboardSubmittedOrderSummary>;
  workspace: PrototypeWorkspaceViewModel;
};

export function DashboardScreen({
  createGroupName = "",
  groupedEvents,
  isCreatingGroup = false,
  nextActions = [],
  onCreateGroup,
  onCreateGroupNameChange,
  onOpenGroup,
  onOpenEvent,
  onOpenOwnerReview,
  recentlyJoinedGroupName = null,
  submittedOrdersByEvent = {},
  workspace,
}: DashboardScreenProps): ReactElement {
  const groupedEventsByGroupId = new Map(groupedEvents.map((group) => [group.groupId, group]));
  const groupCards = workspace.groups.map((group) => {
    const dashboardGroup = groupedEventsByGroupId.get(group.id);
    const events = (dashboardGroup?.events ?? []).filter(
      (event) => !submittedOrdersByEvent[event.eventId],
    );

    return {
      groupId: group.id,
      groupName: group.name,
      roleLabel: group.role,
      eventCount: group.eventCount,
      events,
    };
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreateGroup?.();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreateGroupNameChange?.(event.target.value);
  }

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="메인"
        title="groupictures 시작 화면"
        description="지금 해야 할 작업과 내가 속한 그룹을 먼저 확인하는 시작 화면입니다."
      >
        {recentlyJoinedGroupName ? (
          <StatePanel
            tone="success"
            title={`${recentlyJoinedGroupName} 그룹에 참여했습니다`}
            description="방금 참여한 그룹에서 다음 투표나 이벤트를 바로 확인할 수 있습니다."
          />
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]"
        >
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            새 그룹 이름
            <input
              name="groupName"
              value={createGroupName}
              onChange={handleNameChange}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              placeholder="예: 우리 가족"
            />
          </label>
          <div className="flex items-end">
            <PrimaryAction
              label={isCreatingGroup ? "그룹 생성 중..." : "가족 그룹 만들기"}
              disabled={isCreatingGroup || createGroupName.trim().length === 0}
              type="submit"
            />
          </div>
        </form>
      </PageSection>

      <PageSection
        eyebrow="지금 필요한 작업"
        title="우선 처리할 작업"
        description="초대 확인, 투표 참여, 오너 검토처럼 지금 바로 처리해야 하는 항목만 모아 보여줍니다."
      >
        {nextActions.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {nextActions.map((action) => (
              <li
                key={action.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <strong className="text-base font-semibold text-slate-950">{action.title}</strong>
                <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
                <div className="mt-4">
                  <PrimaryAction label={action.ctaLabel} onClick={action.onCta} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <StatePanel
            tone="empty"
            title="지금 바로 처리할 작업이 없습니다"
            description="새 그룹을 만들거나, 참여 중인 그룹을 둘러보며 다음 이벤트를 준비하면 됩니다."
          />
        )}
      </PageSection>

      <PageSection
        eyebrow="내 그룹"
        title="그룹 리스트"
        description="그룹 카드에서 바로 그룹 페이지로 이동할 수 있습니다. 그룹 이름이나 카드 안의 열기 안내를 눌러 이동해 보세요."
      >
        {groupCards.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {groupCards.map((group) => (
              <li
                key={group.groupId}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-xl font-semibold tracking-tight text-slate-950">
                      {group.groupName}
                    </strong>
                    <button
                      type="button"
                      onClick={() => onOpenGroup?.(group.groupId)}
                      className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                    >
                      그룹 페이지로 이동
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">
                    역할 {group.roleLabel} · 등록된 이벤트 {group.eventCount}개
                  </p>
                </div>

                {group.events.length > 0 ? (
                  <ul className="mt-4 grid gap-3">
                    {group.events.map((event) => (
                      <li
                        key={event.eventId}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenEvent?.(event.eventId)}
                          className="text-left text-base font-semibold text-slate-900"
                        >
                          {event.eventName}
                        </button>
                        <p className="mt-1 text-sm text-slate-600">
                          {getEventStatusLabel(event.status)}
                        </p>
                        {event.previewPhotos.length > 0 ? (
                          <ul className="mt-3 grid gap-2">
                            {event.previewPhotos.slice(0, 5).map((photo) => (
                              <li
                                key={photo.photoId}
                                className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                              >
                                <span>{photo.caption}</span>
                                <span className="text-slate-500">좋아요 {photo.likeCount}개</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">
                            아직 미리보기 사진이 없습니다.
                          </p>
                        )}
                        {event.status === "ready" ? (
                          <div className="mt-4">
                            <PrimaryAction
                              label="SweetBook 작업 열기"
                              onClick={() => onOpenOwnerReview?.(event.eventId)}
                            />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    아직 진행 중인 이벤트가 없습니다.
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <StatePanel
            tone="empty"
            title="아직 속한 그룹이 없습니다"
            description="먼저 가족 그룹을 만들거나 초대를 수락하면 이곳에 그룹이 표시됩니다."
          />
        )}
      </PageSection>
    </div>
  );
}

function getEventStatusLabel(status: string): string {
  if (status === "collecting") {
    return "투표 진행 중";
  }

  if (status === "draft") {
    return "투표 시작 전";
  }

  return "오너 검토 준비 완료";
}
