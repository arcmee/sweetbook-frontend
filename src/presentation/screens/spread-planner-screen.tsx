import { useMemo, useState, type ReactElement } from "react";

import type {
  PrototypeCandidateReviewViewModel,
  PrototypeOrderEntryViewModel,
  PrototypePhotoWorkflowViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type SpreadPlannerScreenProps = {
  activeGroupName?: string;
  activeEventName?: string;
  coverPhotoId?: string;
  isOwnerApproved?: boolean;
  openedFromOwnerReview?: boolean;
  onBack?: () => void;
  onOpenOrder?: () => void;
  onAssignPhotoToSlot?: (pageId: string, slotIndex: number, photoId: string) => void;
  onToggleOwnerApproval?: () => void;
  onSetPageLayout?: (pageId: string, layout: string) => void;
  onSetPageNote?: (pageId: string, note: string) => void;
  onSetCoverPhoto?: (photoId: string) => void;
  orderEntry?: PrototypeOrderEntryViewModel;
  pageAssignments?: Record<string, string[]>;
  pageLayouts?: Record<string, string>;
  pageNotes?: Record<string, string>;
  selectedPhotoIds?: string[];
  unassignedPhotos?: WorkflowPhoto[];
  workflow?: PrototypePhotoWorkflowViewModel;
  workspace: PrototypeWorkspaceViewModel;
  review?: PrototypeCandidateReviewViewModel;
};

type WorkflowPhoto = PrototypePhotoWorkflowViewModel["photos"][number];

type PlannerPageViewModel = {
  pageId: string;
  pageNumber: number;
  title: string;
  layout: string;
  editNote: string;
  recommendedLayout: string;
  recommendedNote: string;
  warning: string | null;
  status: "준비 완료" | "검토 필요";
  photoCaptions: string[];
  photoIds: string[];
};

export function SpreadPlannerScreen({
  activeGroupName,
  activeEventName,
  coverPhotoId,
  isOwnerApproved = false,
  openedFromOwnerReview = false,
  onBack,
  onOpenOrder,
  onAssignPhotoToSlot,
  onToggleOwnerApproval,
  onSetPageLayout,
  onSetPageNote,
  onSetCoverPhoto,
  orderEntry,
  pageAssignments = {},
  pageLayouts = {},
  pageNotes = {},
  selectedPhotoIds = [],
  unassignedPhotos = [],
  workflow,
  workspace,
  review,
}: SpreadPlannerScreenProps): ReactElement {
  const [selectionTarget, setSelectionTarget] = useState<{ pageId: string; slotIndex: number } | null>(null);
  const [isUnassignedWarningOpen, setIsUnassignedWarningOpen] = useState(false);

  const activeEvent =
    workspace.events.find((event) => event.name === activeEventName) ?? workspace.events[0];
  const activeReview = review ?? {
    activeEventId: activeEvent?.id ?? "",
    activeEventName: activeEvent?.name ?? "선택된 이벤트가 없습니다",
    candidates: [],
    pagePreview: [],
  };

  const availablePhotos = workflow?.photos ?? [];
  const activeOrderEntry = orderEntry;
  const minimumSelectedPhotoCount =
    activeOrderEntry?.readinessSummary?.minimumSelectedPhotoCount ?? 3;
  const backendDraftPageCount = activeOrderEntry?.reviewSummary?.draftPageCount ?? 0;
  const backendFlaggedDraftPageCount =
    activeOrderEntry?.reviewSummary?.flaggedDraftPageCount ?? 0;
  const ownerApprovalRequired =
    activeOrderEntry?.reviewSummary?.ownerApprovalRequired ?? true;
  const ownerApprovalMissing = ownerApprovalRequired && !isOwnerApproved;

  const effectiveSelectedPhotoIds =
    selectedPhotoIds.length > 0
      ? selectedPhotoIds
      : activeOrderEntry?.pagePlanner?.selectedPhotoIds?.length
        ? activeOrderEntry.pagePlanner.selectedPhotoIds
        : activeReview.candidates.map((candidate) => candidate.photoId);

  const selectedPhotos = availablePhotos.filter((photo) =>
    effectiveSelectedPhotoIds.includes(photo.id),
  );
  const coverPhoto =
    selectedPhotos.find((photo) => photo.id === coverPhotoId) ??
    selectedPhotos.find((photo) => photo.id === activeOrderEntry?.pagePlanner?.coverPhotoId) ??
    selectedPhotos[0];
  const spreadPhotos = selectedPhotos.filter((photo) => photo.id !== coverPhoto?.id);

  const plannerPages =
    activeOrderEntry?.handoffSummary?.plannerPages?.length
      ? activeOrderEntry.handoffSummary.plannerPages.map((page, index) => ({
          pageId: page.pageId,
          pageNumber: index + 1,
          title: page.title,
          layout: page.layout,
          editNote: page.note,
          recommendedLayout: page.layout,
          recommendedNote: page.note,
          warning: page.warning,
          status: page.warning ? "검토 필요" : "준비 완료",
          photoCaptions: page.photoCaptions,
          photoIds: [],
        }))
      : buildPreviewPages(coverPhoto, spreadPhotos, pageLayouts, pageNotes);

  const readyPageCount = plannerPages.filter((page) => page.status === "준비 완료").length;
  const reviewPageCount = plannerPages.filter((page) => page.status === "검토 필요").length;
  const pendingChecks = plannerPages
    .filter((page) => page.warning)
    .map((page) => `${page.title}: ${page.warning}`);

  const nextBlocker =
    !coverPhoto
      ? "커버 사진을 먼저 정해주세요."
      : selectedPhotos.length < minimumSelectedPhotoCount
        ? `최소 ${minimumSelectedPhotoCount}장의 사진을 선택해야 합니다.`
        : reviewPageCount > 0
          ? pendingChecks[0] ?? "검토가 필요한 페이지를 먼저 정리해주세요."
          : ownerApprovalMissing
            ? "오너 확인이 아직 남아 있습니다."
            : null;

  const canOpenOrder = selectedPhotos.length > 0 && reviewPageCount === 0 && isOwnerApproved;

  const handleProceedToOrder = () => {
    if (unassignedPhotos.length > 0) {
      setIsUnassignedWarningOpen(true);
      return;
    }

    onOpenOrder?.();
  };

  const effectivePageAssignments = useMemo(() => {
    const assignments: Record<string, string[]> = {};
    plannerPages
      .filter((page) => page.pageId !== "cover")
      .forEach((page) => {
        assignments[page.pageId] =
          pageAssignments[page.pageId]?.filter(Boolean) ??
          resolvePagePhotos(page, availablePhotos).map((photo) => photo.id);
      });
    return assignments;
  }, [availablePhotos, pageAssignments, plannerPages]);

  const spreadPhotoUsage = useMemo(() => {
    const usage = new Map<string, { pageId: string; title: string }>();
    plannerPages
      .filter((page) => page.pageId !== "cover")
      .forEach((page) => {
        const assignedIds =
          effectivePageAssignments[page.pageId] ??
          resolvePagePhotos(page, availablePhotos).map((photo) => photo.id);
        assignedIds
          .map((photoId) => availablePhotos.find((photo) => photo.id === photoId))
          .filter((photo): photo is WorkflowPhoto => Boolean(photo))
          .forEach((photo) => {
          usage.set(photo.id, { pageId: page.pageId, title: page.title });
          });
      });
    return usage;
  }, [availablePhotos, effectivePageAssignments, plannerPages]);

  const selectionTargetPage =
    selectionTarget != null
      ? plannerPages.find((page) => page.pageId === selectionTarget.pageId) ?? null
      : null;

  const handleAssignPhotoToSlot = (photoId: string, page: PlannerPageViewModel, slotIndex: number) => {
    if (page.pageId === "cover") {
      onSetCoverPhoto?.(photoId);
      setSelectionTarget(null);
      return;
    }
    onAssignPhotoToSlot?.(page.pageId, slotIndex, photoId);
    setSelectionTarget(null);
  };

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="2단계"
        title="스프레드 구성"
        description="선택한 사진을 커버와 페이지에 배치해서 책 구성을 마무리합니다. 이 단계의 변경은 주문 단계로 넘어갈 때 저장됩니다."
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">
              현재 그룹: {activeGroupName ?? "선택된 그룹이 없습니다"}
            </p>
            <p className="text-sm text-slate-600">
              현재 이벤트: {activeEventName ?? activeReview.activeEventName}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="선택된 사진" value={`${selectedPhotos.length}장`} />
              <SummaryCard label="준비 완료 페이지" value={`${readyPageCount}장`} />
              <SummaryCard label="검토 필요 페이지" value={`${reviewPageCount}장`} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {nextBlocker ?? "페이지 구성이 정리되었습니다. 주문 단계로 넘어갈 수 있습니다."}
            </div>
            <div className="flex flex-wrap gap-3">
              <PrimaryAction label="이전: 사진 선택" onClick={onBack} />
              <PrimaryAction
                label="책 구성 확정 후 주문으로"
                onClick={handleProceedToOrder}
                disabled={!canOpenOrder}
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            {openedFromOwnerReview ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                오너 검토 단계로 들어왔습니다. 스프레드 구성을 마무리하고 오너 확인을 남겨주세요.
              </div>
            ) : null}
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">오너 확인</h3>
              <p className="mt-1">
                {isOwnerApproved
                  ? "오너 확인이 완료되었습니다."
                  : "구성이 끝나면 오너 확인 버튼을 눌러 주문 단계로 넘겨주세요."}
              </p>
              <div className="mt-3">
                <PrimaryAction
                  label={isOwnerApproved ? "오너 확인 취소" : "이 구성 확인하기"}
                  onClick={onToggleOwnerApproval}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">현재 작업 요약</h3>
              <p>초안 페이지 수: {backendDraftPageCount || plannerPages.length}장</p>
              <p>검토 경고 페이지: {backendFlaggedDraftPageCount}장</p>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="배치"
        title="커버와 페이지 미리보기"
        description="번호 슬롯을 눌러 각 스프레드에 들어갈 사진을 고릅니다. 이미 다른 스프레드에서 사용 중인 사진은 위치를 함께 표시합니다."
      >
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950">커버 미리보기</h3>
                <PrimaryAction
                  label="커버 사진 고르기"
                  onClick={() => setSelectionTarget({ pageId: "cover", slotIndex: 0 })}
                />
              </div>
              {coverPhoto ? (
                <div className="mt-4 grid gap-4">
                  <PhotoPreviewCard photo={coverPhoto} aspectClassName="aspect-[3/4]" />
                  <div className="grid gap-1 text-sm text-slate-700">
                    <strong className="text-base text-slate-950">{coverPhoto.caption}</strong>
                    <p>업로드: {coverPhoto.uploadedBy}</p>
                    <p>좋아요 {coverPhoto.likeCount}개</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  아직 커버가 없습니다. 버튼을 눌러 선택된 사진 중에서 커버를 지정해주세요.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">선택된 사진</h3>
              <p className="mt-1 text-sm text-slate-600">
                각 사진은 한 번만 스프레드에 배치됩니다. 이미 사용 중인 사진도 현재 위치가 함께 표시됩니다.
              </p>
              {spreadPhotos.length > 0 ? (
                <ul className="mt-4 grid gap-3">
                  {spreadPhotos.map((photo, index) => {
                    const usage = spreadPhotoUsage.get(photo.id);
                    return (
                      <li
                        key={photo.id}
                        className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                      >
                        <div className="grid grid-cols-[72px_1fr] gap-3">
                          <PhotoThumb photo={photo} />
                          <div className="grid gap-1 text-sm text-slate-700">
                            <p className="font-semibold text-slate-950">
                              {index + 1}. {photo.caption}
                            </p>
                            <p>업로드: {photo.uploadedBy}</p>
                            <p>좋아요 {photo.likeCount}개</p>
                            <p className="text-xs text-slate-500">
                              {usage ? `${usage.title}에서 사용 중` : "아직 스프레드에 배치되지 않음"}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  커버를 제외한 사진을 선택하면 여기에서 사용할 사진 목록을 볼 수 있습니다.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {plannerPages.length > 0 ? (
              <ul className="grid gap-4">
                {plannerPages.map((page) => {
                  const assignedIds =
                    effectivePageAssignments[page.pageId] ??
                    page.photoIds;
                  const pagePhotos = assignedIds
                    .map((photoId) => availablePhotos.find((photo) => photo.id === photoId))
                    .filter((photo): photo is WorkflowPhoto => Boolean(photo));
                  return (
                    <li
                      key={page.pageId}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">{page.status}</p>
                          <h3 className="text-lg font-semibold text-slate-950">{page.title}</h3>
                          <p className="text-sm text-slate-600">{page.pageNumber}페이지</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {page.warning ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              {page.warning}
                            </span>
                          ) : null}
                          <PrimaryAction
                            label={page.pageId === "cover" ? "커버 첫 슬롯 고르기" : `${page.title} 1번 슬롯 고르기`}
                            onClick={() => setSelectionTarget({ pageId: page.pageId, slotIndex: 0 })}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              페이지 미리보기
                            </p>
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                              {renderPlannerLayoutPreview(page, pagePhotos, (slotIndex) =>
                                setSelectionTarget({ pageId: page.pageId, slotIndex }),
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-sm font-semibold text-slate-900">배치된 사진</p>
                            {pagePhotos.length > 0 ? (
                              <ul className="grid gap-2 text-sm text-slate-700">
                                {pagePhotos.map((photo) => (
                                  <li
                                    key={`${page.pageId}-${photo.id}`}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                  >
                                    {photo.caption}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-600">아직 배치된 사진이 없습니다.</p>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <label className="grid gap-2 text-sm font-medium text-slate-700">
                            페이지 레이아웃
                            <select
                              value={page.layout}
                              onChange={(event) => onSetPageLayout?.(page.pageId, event.target.value)}
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                            >
                              {getLayoutOptions(page.pageId === "cover").map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-2 text-sm font-medium text-slate-700">
                            편집 메모
                            <textarea
                              defaultValue={page.editNote}
                              onBlur={(event) => onSetPageNote?.(page.pageId, event.target.value)}
                              className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                              placeholder="이 페이지에서 강조할 내용이나 설명을 적어주세요."
                            />
                          </label>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
                선택된 사진이 있어야 페이지 미리보기를 만들 수 있습니다.
              </div>
            )}
          </div>
        </div>
      </PageSection>

      {selectionTargetPage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={() => setSelectionTarget(null)}
        >
          <div
            className="w-full max-w-5xl rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">스프레드 사진 선택</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{selectionTargetPage.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectionTargetPage.pageId === "cover"
                    ? "커버에 사용할 사진을 고르세요."
                    : `${selectionTargetPage.title}의 ${selectionTarget.slotIndex + 1}번 슬롯에 넣을 사진을 고르세요. 이미 다른 스프레드에서 사용 중인 사진은 현재 위치를 함께 표시합니다.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectionTarget(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                닫기
              </button>
            </div>

            {spreadPhotos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spreadPhotos.map((photo) => {
                  const usage = spreadPhotoUsage.get(photo.id);
                  const isCurrentPage = usage?.pageId === selectionTargetPage.pageId;
                  const isUsedElsewhere = Boolean(usage && usage.pageId !== selectionTargetPage.pageId);
                  return (
                    <article
                      key={photo.id}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <PhotoPreviewCard photo={photo} aspectClassName="aspect-[4/3]" />
                      <div className="grid gap-1 text-sm text-slate-700">
                        <strong className="text-base text-slate-950">{photo.caption}</strong>
                        <p>업로드: {photo.uploadedBy}</p>
                        <p>좋아요 {photo.likeCount}개</p>
                        {isCurrentPage ? (
                          <p className="text-emerald-700">현재 이 스프레드에 배치됨</p>
                        ) : isUsedElsewhere ? (
                          <p className="text-amber-700">이미 사용 중: {usage?.title}</p>
                        ) : (
                          <p className="text-slate-500">아직 스프레드에 배치되지 않음</p>
                        )}
                      </div>
                      <PrimaryAction
                        label={
                          selectionTargetPage.pageId === "cover"
                            ? "커버로 지정"
                            : `${selectionTargetPage.title} ${selectionTarget.slotIndex + 1}번에 배치`
                        }
                        onClick={() => handleAssignPhotoToSlot(photo.id, selectionTargetPage, selectionTarget.slotIndex)}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
                먼저 사진 선택 단계에서 책에 넣을 사진을 골라주세요.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isUnassignedWarningOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={() => setIsUnassignedWarningOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-600">배치 확인 필요</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  아직 페이지에 배치하지 않은 사진이 있습니다
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  선택은 했지만 스프레드에 넣지 않은 사진이 {unassignedPhotos.length}장 있습니다.
                  이 상태로 주문 단계로 넘어가면 배치되지 않은 사진은 초안에 포함되지 않을 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUnassignedWarningOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                닫기
              </button>
            </div>

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-900">미배치 사진</p>
              <ul className="grid gap-2 text-sm text-slate-700">
                {unassignedPhotos.map((photo) => (
                  <li
                    key={photo.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    {photo.caption}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <PrimaryAction
                label="스프레드에 더 배치하기"
                onClick={() => setIsUnassignedWarningOpen(false)}
              />
              <PrimaryAction
                label="확인 후 주문 단계로"
                onClick={() => {
                  setIsUnassignedWarningOpen(false);
                  onOpenOrder?.();
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PhotoPreviewCard({
  photo,
  aspectClassName,
}: {
  photo: WorkflowPhoto;
  aspectClassName: string;
}): ReactElement {
  if (photo.assetUrl) {
    return (
      <img
        src={photo.assetUrl}
        alt={`${photo.caption} 미리보기`}
        className={`w-full rounded-2xl object-cover ${aspectClassName}`}
      />
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-center rounded-2xl bg-slate-100 px-4 text-center text-sm text-slate-500 ${aspectClassName}`}
    >
      이미지 미리보기가 없습니다.
    </div>
  );
}

function PhotoThumb({ photo }: { photo: WorkflowPhoto }): ReactElement {
  if (photo.assetUrl) {
    return (
      <img
        src={photo.assetUrl}
        alt={`${photo.caption} 썸네일`}
        className="h-[72px] w-[72px] rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-slate-200 text-xs text-slate-500">
      사진
    </div>
  );
}

function renderPlannerLayoutPreview(
  page: PlannerPageViewModel,
  photos: WorkflowPhoto[],
  onSelectSlot: (slotIndex: number) => void,
): ReactElement {
  if (page.pageId === "cover" || page.layout.includes("커버")) {
    if (page.layout === "중앙 정렬 커버") {
      return (
        <div className="grid h-[320px] place-items-center rounded-2xl bg-slate-100 p-6">
          <div className="grid h-full w-full max-w-[220px] grid-rows-[1fr_auto] gap-3">
            <LayoutSlot
              label="커버"
              className="min-h-0 bg-white text-slate-900"
              sublabel={photos[0] ? photos[0].caption : "대표 사진"}
              onClick={() => onSelectSlot(0)}
            />
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-xs font-semibold text-white">
              중앙 타이틀 영역
            </div>
          </div>
        </div>
      );
    }

    if (page.layout === "타이틀 강조 커버") {
      return (
        <div className="grid h-[320px] grid-rows-[auto_1fr] gap-3">
          <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Title</p>
            <p className="mt-2 text-sm font-semibold">제목과 부제를 크게 보여주는 커버</p>
          </div>
          <LayoutSlot
            label="커버"
            className="min-h-0 bg-slate-100 text-slate-900"
            sublabel={photos[0] ? photos[0].caption : "대표 사진"}
            onClick={() => onSelectSlot(0)}
          />
        </div>
      );
    }

    return (
      <div className="grid h-[320px] gap-3">
        <LayoutSlot
          label="커버"
          className="min-h-0 flex-1 bg-slate-900 text-white"
          sublabel={photos[0] ? photos[0].caption : "대표 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <div className="rounded-2xl bg-slate-200 px-4 py-3 text-sm text-slate-700">타이틀 영역</div>
      </div>
    );
  }

  if (page.layout === "단일 사진 강조 레이아웃") {
    return (
      <div className="grid h-[320px] gap-3">
        <LayoutSlot
          label="1"
          className="min-h-0 flex-1 bg-slate-100 text-slate-900"
          sublabel={photos[0] ? photos[0].caption : "대표 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
          큰 사진 한 장과 짧은 설명이 들어가는 구성
        </div>
      </div>
    );
  }

  if (page.layout === "균형 배치 2컷 구성") {
    return (
      <div className="grid h-[320px] gap-3 md:grid-cols-2">
        <LayoutSlot
          label="1"
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={photos[0] ? photos[0].caption : "첫 번째 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <LayoutSlot
          label="2"
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={photos[1] ? photos[1].caption : "두 번째 사진"}
          onClick={() => onSelectSlot(1)}
        />
      </div>
    );
  }

  if (page.layout === "콜라주 스타일") {
    return (
      <div className="grid h-[320px] gap-3 md:grid-cols-[1.1fr_0.9fr]">
        <LayoutSlot
          label="1"
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={photos[0] ? photos[0].caption : "메인 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <div className="grid min-h-0 gap-3">
          <LayoutSlot
            label="2"
            className="min-h-0 flex-1 bg-slate-100 text-slate-900"
            sublabel={photos[1] ? photos[1].caption : "보조 사진"}
            onClick={() => onSelectSlot(1)}
          />
          <LayoutSlot
            label="3"
            className="min-h-0 flex-1 border-dashed bg-white text-slate-500"
            sublabel="선택 사항"
            onClick={() => onSelectSlot(1)}
          />
        </div>
      </div>
    );
  }

  if (page.layout === "캡션 강조 스프레드") {
    return (
      <div className="grid h-[320px] gap-3">
        <div className="grid min-h-0 gap-3 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl bg-slate-900 px-4 py-5 text-sm text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Caption</p>
            <p className="mt-2 leading-6">
              이 페이지는 사진 설명과 짧은 이야기를 함께 보여주는 구성을 사용합니다.
            </p>
          </div>
          <LayoutSlot
            label="1"
            className="min-h-0 bg-slate-100 text-slate-900"
            sublabel={photos[0] ? photos[0].caption : "대표 사진"}
            onClick={() => onSelectSlot(0)}
          />
        </div>
        <LayoutSlot
          label="2"
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={photos[1] ? photos[1].caption : "보조 사진"}
          onClick={() => onSelectSlot(1)}
        />
      </div>
    );
  }

  return (
    <div className={`grid h-[320px] gap-3 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {(photos.length > 0 ? photos : [undefined]).map((photo, index) => (
        <LayoutSlot
          key={`${page.pageId}-${photo?.id ?? index}`}
          label={`${index + 1}`}
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={photo ? photo.caption : "사진 자리"}
          onClick={() => onSelectSlot(index)}
        />
      ))}
    </div>
  );
}

function LayoutSlot({
  label,
  className,
  sublabel,
  onClick,
}: {
  label: string;
  className: string;
  sublabel: string;
  onClick?: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-300 px-3 py-3 text-center transition hover:scale-[1.01] hover:border-slate-500 ${className}`}
    >
      <span className="text-2xl font-bold leading-none">{label}</span>
      <span className="mt-2 line-clamp-2 text-[11px] opacity-80">{sublabel}</span>
    </button>
  );
}

function resolvePagePhotos(
  page: PlannerPageViewModel,
  availablePhotos: WorkflowPhoto[],
): WorkflowPhoto[] {
  if (page.photoIds.length > 0) {
    return page.photoIds
      .map((photoId) => availablePhotos.find((photo) => photo.id === photoId))
      .filter((photo): photo is WorkflowPhoto => Boolean(photo));
  }

  return page.photoCaptions
    .map((caption) => availablePhotos.find((photo) => photo.caption === caption))
    .filter((photo): photo is WorkflowPhoto => Boolean(photo));
}

function buildPreviewPages(
  coverPhoto: WorkflowPhoto | undefined,
  spreadPhotos: WorkflowPhoto[],
  pageLayouts: Record<string, string>,
  pageNotes: Record<string, string>,
): PlannerPageViewModel[] {
  const pages: PlannerPageViewModel[] = [];

  if (coverPhoto) {
    const pageId = "cover";
    const recommendedLayout = "풀블리드 커버";
    const recommendedNote = "대표 사진 한 장을 커버로 사용합니다.";
    const layout = pageLayouts[pageId] ?? recommendedLayout;
    const editNote = pageNotes[pageId] ?? recommendedNote;
    const warning = editNote.trim().length === 0 ? "커버 메모를 입력해주세요." : null;

    pages.push({
      pageId,
      pageNumber: 1,
      title: "커버 미리보기",
      layout,
      editNote,
      recommendedLayout,
      recommendedNote,
      warning,
      status: warning ? "검토 필요" : "준비 완료",
      photoCaptions: [coverPhoto.caption],
      photoIds: [coverPhoto.id],
    });
  }

  for (let index = 0; index < spreadPhotos.length; index += 2) {
    const photos = spreadPhotos.slice(index, index + 2);
    const spreadNumber = Math.floor(index / 2) + 1;
    const pageId = `spread-${spreadNumber}`;
    const recommendedLayout = getDefaultSpreadLayout(photos.length);
    const recommendedNote =
      photos.length > 1
        ? "두 장의 사진이 자연스럽게 이어지도록 스프레드를 구성합니다."
        : "한 장의 사진을 중심으로 메시지를 전달합니다.";
    const layout = pageLayouts[pageId] ?? recommendedLayout;
    const editNote = pageNotes[pageId] ?? recommendedNote;
    const warning = getPageWarning(layout, photos.length, editNote);

    pages.push({
      pageId,
      pageNumber: pages.length + 1,
      title: `Spread ${spreadNumber}`,
      layout,
      editNote,
      recommendedLayout,
      recommendedNote,
      warning,
      status: warning ? "검토 필요" : "준비 완료",
      photoCaptions: photos.map((photo) => photo.caption),
      photoIds: photos.map((photo) => photo.id),
    });
  }

  return pages;
}

function getDefaultSpreadLayout(photoCount: number): string {
  return photoCount > 1 ? "균형 배치 2컷 구성" : "단일 사진 강조 레이아웃";
}

function getLayoutOptions(isCover: boolean): string[] {
  return isCover
    ? ["풀블리드 커버", "중앙 정렬 커버", "타이틀 강조 커버"]
    : ["균형 배치 2컷 구성", "단일 사진 강조 레이아웃", "콜라주 스타일", "캡션 강조 스프레드"];
}

function getPageWarning(layout: string, photoCount: number, editNote: string): string | null {
  if (editNote.trim().length === 0) {
    return "페이지 메모를 입력해주세요.";
  }

  if (layout === "단일 사진 강조 레이아웃" && photoCount > 1) {
    return "단일 사진 강조 레이아웃은 사진 1장일 때 가장 자연스럽습니다.";
  }

  if (layout === "균형 배치 2컷 구성" && photoCount < 2) {
    return "2컷 구성 레이아웃은 사진 2장이 필요합니다.";
  }

  if (layout === "콜라주 스타일" && photoCount < 2) {
    return "콜라주 스타일은 최소 2장의 사진이 필요합니다.";
  }

  return null;
}
