import type { ReactElement } from "react";

import {
  getPrototypePhotoWorkflowViewModel,
  type PrototypePhotoWorkflowViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";
import { PhotoWorkflowSection } from "./photo-workflow-section";

type EventSubmittedOrderSummary = {
  bookUid: string;
  orderStatusDisplay?: string | null;
  orderUid: string;
};

type EventScreenProps = {
  canManageVoting?: boolean;
  workspace: PrototypeWorkspaceViewModel;
  createPhotoCaption?: string;
  createPhotoFileName?: string;
  createPhotoPreviewUrl?: string;
  isCreatingPhoto?: boolean;
  isLikingPhoto?: boolean;
  onCloseVoting?: () => void | Promise<void>;
  onCreatePhoto?: () => void | Promise<void>;
  onCreatePhotoCaptionChange?: (value: string) => void;
  onCreatePhotoFileChange?: (file: File | null) => void;
  onExtendVoting?: () => void | Promise<void>;
  onLikePhoto?: (photoId: string) => void | Promise<void>;
  selectedEventId?: string;
  selectedGroupName?: string;
  submittedOrder?: EventSubmittedOrderSummary;
  workflow?: PrototypePhotoWorkflowViewModel;
};

export function EventScreen({
  canManageVoting = false,
  workspace,
  createPhotoCaption = "",
  createPhotoFileName,
  createPhotoPreviewUrl,
  isCreatingPhoto = false,
  isLikingPhoto = false,
  onCloseVoting,
  onCreatePhoto,
  onCreatePhotoCaptionChange,
  onCreatePhotoFileChange,
  onExtendVoting,
  onLikePhoto,
  selectedEventId,
  selectedGroupName,
  submittedOrder,
  workflow,
}: EventScreenProps): ReactElement {
  const activeEvent =
    workspace.events.find((event) => event.id === selectedEventId) ?? workspace.events[0];

  if (!activeEvent) {
    return (
      <PageSection
        eyebrow="이벤트"
        title="이벤트가 없습니다"
        description="먼저 그룹 페이지에서 이벤트를 만들어야 사진 업로드와 투표를 시작할 수 있습니다."
      >
        <StatePanel
          tone="empty"
          title="선택된 이벤트가 없습니다"
          description="그룹 페이지에서 이벤트를 만들거나 다른 이벤트를 선택한 뒤 다시 들어와 주세요."
        />
      </PageSection>
    );
  }

  const photoWorkflow = workflow ?? getPrototypePhotoWorkflowViewModel(activeEvent.id);
  const votingPresentation = getVotingPresentation(activeEvent);
  const lifecycleSummary = getLifecycleSummary(activeEvent);

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="이벤트"
        title={activeEvent.name}
        description="구성원들이 사진을 올리고 좋아요를 남기며, 투표가 끝나면 오너가 최종 구성을 검토하는 이벤트 화면입니다."
      >
        {submittedOrder ? (
          <StatePanel
            tone="success"
            title="SweetBook 작업이 이미 완료되었습니다"
            description={`주문 ${submittedOrder.orderUid}가 책 ${submittedOrder.bookUid}로 제출되었습니다${submittedOrder.orderStatusDisplay ? ` (${submittedOrder.orderStatusDisplay})` : ""}.`}
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">
              현재 그룹: {selectedGroupName ?? "선택된 그룹이 없습니다"}
            </p>
            <p className="text-base leading-7 text-slate-700">
              {activeEvent.description ?? "이 이벤트 설명은 아직 입력되지 않았습니다."}
            </p>
            <div className="grid gap-1 text-sm text-slate-700">
              <p>현재 단계: {lifecycleSummary.phaseLabel}</p>
              <p>{lifecycleSummary.nextStep}</p>
              <p>SweetBook 작업: {getSweetBookOperationHeadline(activeEvent, submittedOrder)}</p>
              <p>{getSweetBookOperationHint(activeEvent, submittedOrder)}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-950">투표 상태</h3>
            <p className="text-sm font-semibold text-teal-700">{votingPresentation.badgeLabel}</p>
            <p className="text-base font-medium text-slate-900">{votingPresentation.headline}</p>
            <p className="text-sm leading-6 text-slate-600">{votingPresentation.supportingText}</p>
            <p className="text-sm text-slate-600">
              투표 기간: {formatVotingDate(activeEvent.votingStartsAt)} ~{" "}
              {formatVotingDate(activeEvent.votingEndsAt)}
            </p>
            <p className="text-sm text-slate-600">
              현재 이 이벤트에 연결된 사진은 {activeEvent.photoCount}장입니다.
            </p>
          </div>
        </div>

        {canManageVoting ? (
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">오너용 투표 제어</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {votingPresentation.ownerActionState}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {votingPresentation.ownerHint}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryAction label="투표 3일 연장" onClick={() => void onExtendVoting?.()} />
              <PrimaryAction
                label="지금 투표 종료"
                onClick={() => void onCloseVoting?.()}
                disabled={activeEvent.canOwnerSelectPhotos}
              />
            </div>
          </div>
        ) : null}
      </PageSection>

      <PhotoWorkflowSection
        canVote={activeEvent.canVote}
        workflow={photoWorkflow}
        createPhotoCaption={createPhotoCaption}
        createPhotoFileName={createPhotoFileName}
        createPhotoPreviewUrl={createPhotoPreviewUrl}
        isCreatingPhoto={isCreatingPhoto}
        isLikingPhoto={isLikingPhoto}
        onCreatePhoto={onCreatePhoto}
        onCreatePhotoCaptionChange={onCreatePhotoCaptionChange}
        onCreatePhotoFileChange={onCreatePhotoFileChange}
        onLikePhoto={onLikePhoto}
      />
    </div>
  );
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

function getVotingPresentation(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
): {
  badgeLabel: string;
  headline: string;
  supportingText: string;
  ownerHint: string;
  ownerActionState: string;
} {
  if (!activeEvent) {
    return {
      badgeLabel: "선택된 이벤트 없음",
      headline: "투표를 보려면 이벤트를 선택하세요",
      supportingText: "이벤트를 선택하면 투표 상태와 기간을 바로 확인할 수 있습니다.",
      ownerHint: "오너 제어는 이벤트를 선택한 뒤 표시됩니다.",
      ownerActionState: "이벤트를 선택하기 전에는 오너 제어를 사용할 수 없습니다.",
    };
  }

  if (activeEvent.canOwnerSelectPhotos) {
    return {
      badgeLabel: "투표 종료",
      headline: "이제 오너가 사진을 고를 수 있습니다",
      supportingText: "이 이벤트는 투표가 끝나고 오너 검토 단계로 넘어갔습니다.",
      ownerHint: "필요하면 투표 기간을 다시 연장해서 검토를 뒤로 미룰 수 있습니다.",
      ownerActionState: "투표가 종료되었습니다. 앨범 초안 정리와 SweetBook 작업으로 이어갈 수 있습니다.",
    };
  }

  if (activeEvent.canVote) {
    const timeLeft = getTimeLeftLabel(activeEvent.votingEndsAt);
    return {
      badgeLabel: timeLeft === "1시간 미만 남음" ? "마감 임박" : "투표 진행 중",
      headline:
        timeLeft === "1시간 미만 남음"
          ? "이 이벤트의 투표가 곧 마감됩니다"
          : "이 이벤트는 현재 투표를 받고 있습니다",
      supportingText: timeLeft
        ? `남은 시간: ${timeLeft}`
        : "구성원들이 지금 좋아요를 남길 수 있는 상태입니다.",
      ownerHint: "필요하면 투표 기간을 연장하거나 바로 종료할 수 있습니다.",
      ownerActionState: "지금은 오너가 투표 기간을 조정할 수 있는 상태입니다.",
    };
  }

  return {
    badgeLabel: "투표 전",
    headline: "이 이벤트의 투표가 아직 열리지 않았습니다",
    supportingText: activeEvent.votingStartsAt
      ? `투표 시작 시각: ${formatVotingDate(activeEvent.votingStartsAt)}`
      : "투표 기간을 먼저 정해야 합니다.",
    ownerHint: "투표가 시작되면 이 화면에서 진행 상태를 계속 확인할 수 있습니다.",
    ownerActionState: "지금은 투표 시작을 기다리는 단계입니다.",
  };
}

function getTimeLeftLabel(value?: string): string | null {
  if (!value) {
    return null;
  }

  const endsAt = new Date(value);
  if (Number.isNaN(endsAt.valueOf())) {
    return null;
  }

  const diffMs = endsAt.valueOf() - Date.now();
  if (diffMs <= 0) {
    return "1시간 미만 남음";
  }

  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (totalHours < 24) {
    return `${totalHours}시간 남음`;
  }

  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays}일 남음`;
}

function getLifecycleSummary(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
): {
  phaseLabel: string;
  nextStep: string;
} {
  if (!activeEvent) {
    return {
      phaseLabel: "단계 없음",
      nextStep: "이벤트를 선택하면 현재 상태를 볼 수 있습니다.",
    };
  }

  if (activeEvent.status === "draft") {
    return {
      phaseLabel: "준비 단계",
      nextStep: "투표가 시작되면 구성원들이 사진을 올리고 좋아요를 남길 수 있습니다.",
    };
  }

  if (activeEvent.status === "collecting") {
    return {
      phaseLabel: "투표 진행 중",
      nextStep: "좋아요를 충분히 모은 뒤 오너 검토 단계로 넘어갑니다.",
    };
  }

  return {
    phaseLabel: "오너 검토",
    nextStep: "오너가 사진을 최종 정리하고 SweetBook 작업으로 이어갈 수 있습니다.",
  };
}

function getSweetBookOperationHeadline(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
  submittedOrder: EventSubmittedOrderSummary | undefined,
): string {
  if (submittedOrder) {
    return "이 이벤트의 SweetBook 작업은 이미 완료되었습니다.";
  }

  if (!activeEvent) {
    return "이벤트를 선택하면 SweetBook 흐름을 볼 수 있습니다.";
  }

  return (
    activeEvent.operationSummary?.detail ??
    "이 이벤트는 아직 준비 단계라 SweetBook 작업으로 넘어갈 수 없습니다."
  );
}

function getSweetBookOperationHint(
  activeEvent: PrototypeWorkspaceViewModel["events"][number] | undefined,
  submittedOrder: EventSubmittedOrderSummary | undefined,
): string {
  if (submittedOrder) {
    return `주문 ${submittedOrder.orderUid}로 완료된 이벤트입니다.`;
  }

  if (!activeEvent) {
    return "이벤트를 선택하면 오너 검토와 SweetBook 전달 흐름을 볼 수 있습니다.";
  }

  if (activeEvent.operationSummary?.stage === "owner_review") {
    return "투표가 끝난 뒤 오너가 사진을 고르고 SweetBook 작업으로 이어갈 수 있습니다.";
  }

  if (activeEvent.operationSummary?.stage === "voting") {
    return "투표가 진행 중입니다. 사진과 좋아요를 충분히 모아 보세요.";
  }

  return "먼저 투표를 열고, 반응을 모은 뒤 SweetBook 작업으로 진행할 수 있습니다.";
}
