import { useMemo, useState, type ReactElement } from "react";

import type {
  PrototypeCandidateReviewViewModel,
  PrototypeOrderEntryViewModel,
  PrototypePhotoWorkflowViewModel,
  PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type WorkflowPhoto = PrototypePhotoWorkflowViewModel["photos"][number];

type SpreadPlannerScreenProps = {
  activeGroupName?: string;
  activeEventName?: string;
  coverPhotoId?: string;
  isOwnerApproved?: boolean;
  openedFromOwnerReview?: boolean;
  onBack?: () => void;
  onOpenOrder?: () => void;
  onAssignPhotoToSlot?: (pageId: string, slotIndex: number, photoId: string) => void;
  onAddPage?: () => void;
  onRemovePage?: (pageId: string) => void;
  onToggleOwnerApproval?: () => void;
  onSetCoverPhoto?: (photoId: string) => void;
  onSetPageLayout?: (pageId: string, layout: string) => void;
  onSetPageNote?: (pageId: string, note: string) => void;
  orderEntry?: PrototypeOrderEntryViewModel;
  pageAssignments?: Record<string, string[]>;
  pageLayouts?: Record<string, string>;
  pageNotes?: Record<string, string>;
  review?: PrototypeCandidateReviewViewModel;
  selectedPhotoIds?: string[];
  workflow?: PrototypePhotoWorkflowViewModel;
  workspace: PrototypeWorkspaceViewModel;
};

type PlannerPageViewModel = {
  pageId: string;
  pageNumber: number;
  title: string;
  layout: string;
  note: string;
  slotCount: number;
  slotPhotoIds: string[];
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
  onAddPage,
  onRemovePage,
  onToggleOwnerApproval,
  onSetCoverPhoto,
  onSetPageLayout,
  onSetPageNote,
  review,
  pageAssignments = {},
  pageLayouts = {},
  pageNotes = {},
  selectedPhotoIds = [],
  workflow,
}: SpreadPlannerScreenProps): ReactElement {
  const [selectionTarget, setSelectionTarget] = useState<{
    pageId: string;
    slotIndex: number;
  } | null>(null);

  const activeReview = review ?? {
    activeEventId: "",
    activeEventName: activeEventName ?? "선택된 이벤트가 없습니다",
    candidates: [],
    pagePreview: [],
  };

  const availablePhotos = workflow?.photos ?? [];
  const selectedPhotos = availablePhotos.filter((photo) => selectedPhotoIds.includes(photo.id));
  const coverPhoto = selectedPhotos.find((photo) => photo.id === coverPhotoId) ?? selectedPhotos[0];
  const spreadPhotoPool = selectedPhotos.filter((photo) => photo.id !== coverPhoto?.id);
  const minimumSpreadPageCount = Math.max(
    1,
    Math.ceil(Math.max(spreadPhotoPool.length, 1) / 2),
  );

  const plannerPages = useMemo(
    () => buildPlannerPages(coverPhoto, spreadPhotoPool, pageAssignments, pageLayouts, pageNotes),
    [coverPhoto, spreadPhotoPool, pageAssignments, pageLayouts, pageNotes],
  );

  const readyPageCount = plannerPages.filter((page) => !getPageWarning(page.layout, page.slotPhotoIds)).length;
  const reviewPageCount = plannerPages.length - readyPageCount;
  const nextBlocker =
    !coverPhoto
      ? "커버 사진을 먼저 정해주세요."
      : !isOwnerApproved
        ? "페이지 구성이 끝나면 오너 확인을 완료해주세요."
        : null;

  const selectionTargetPage =
    selectionTarget == null
      ? null
      : plannerPages.find((page) => page.pageId === selectionTarget.pageId) ?? null;

  function handleSelectPhotoForSlot(photoId: string): void {
    if (!selectionTarget) {
      return;
    }

    if (selectionTarget.pageId === "cover") {
      onSetCoverPhoto?.(photoId);
      setSelectionTarget(null);
      return;
    }

    onAssignPhotoToSlot?.(selectionTarget.pageId, selectionTarget.slotIndex, photoId);
    setSelectionTarget(null);
  }

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="2단계"
        title="스프레드 구성"
        description="각 페이지의 슬롯을 눌러 사진을 배치하세요. 같은 사진을 여러 페이지와 여러 슬롯에 중복해서 넣어도 됩니다."
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-2">
              <p className="text-sm text-slate-600">
                현재 그룹: {activeGroupName ?? "선택된 그룹이 없습니다"}
              </p>
              <p className="text-sm text-slate-600">
                현재 이벤트: {activeEventName ?? activeReview.activeEventName}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard label="선택된 사진" value={`${selectedPhotos.length}장`} />
              <SummaryCard label="준비 완료 페이지" value={`${readyPageCount}장`} />
              <SummaryCard label="검토 필요 페이지" value={`${reviewPageCount}장`} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {nextBlocker ?? "페이지 구성이 준비되었습니다. 주문 단계로 이동할 수 있습니다."}
            </div>

            <div className="flex flex-wrap gap-3">
              <PrimaryAction label="이전: 사진 선택" onClick={onBack} />
              <PrimaryAction
                label="책 구성 확정 후 주문으로"
                onClick={onOpenOrder}
                disabled={selectedPhotos.length === 0}
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            {openedFromOwnerReview ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                오너 검토 단계로 들어왔습니다. 페이지 구성을 확인한 뒤 주문 단계로 넘어가세요.
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">오너 확인</h3>
              <p className="mt-1">
                {isOwnerApproved
                  ? "오너 확인이 완료되었습니다."
                  : "페이지 구성이 끝나면 오너 확인 버튼을 눌러 주문 단계로 넘어가세요."}
              </p>
              <div className="mt-3">
                <PrimaryAction
                  label={isOwnerApproved ? "오너 확인 취소" : "이 구성을 확인하기"}
                  onClick={onToggleOwnerApproval}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
              <h3 className="font-semibold text-slate-900">선택된 사진 목록</h3>
              <p className="mt-1 text-slate-600">
                아래 사진들은 스프레드 슬롯에서 자유롭게 반복해서 사용할 수 있습니다.
              </p>
              {selectedPhotos.length > 0 ? (
                <ul className="mt-3 grid gap-3">
                  {selectedPhotos.map((photo) => (
                    <li
                      key={photo.id}
                      className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <PhotoThumb photo={photo} />
                      <div className="grid gap-1 text-sm text-slate-700">
                        <p className="font-semibold text-slate-950">{photo.caption}</p>
                        <p>업로드: {photo.uploadedBy}</p>
                        <p>좋아요 {photo.likeCount}개</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  먼저 사진 선택 단계에서 책에 넣을 사진을 골라주세요.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="배치"
        title="커버와 스프레드 구성"
        description="각 슬롯을 눌러 사진을 배치합니다. 레이아웃에 따라 슬롯 수가 달라집니다."
      >
        <div className="grid gap-4">
          {plannerPages.length > 0 ? (
            <>
              <ul className="grid gap-4">
                {plannerPages.map((page) => {
                  const slotPhotos = page.slotPhotoIds.map((photoId) =>
                    photoId ? availablePhotos.find((photo) => photo.id === photoId) : undefined,
                  );
                  const warning = getPageWarning(page.layout, page.slotPhotoIds);
                  const pageIndex = Number(page.pageId.replace("spread-", ""));
                  const canRemovePage =
                    page.pageId !== "cover" &&
                    !Number.isNaN(pageIndex) &&
                    pageIndex > minimumSpreadPageCount;

                  return (
                    <li
                      key={page.pageId}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">
                            {warning ? "검토 필요" : "준비 완료"}
                          </p>
                          <h3 className="text-lg font-semibold text-slate-950">{page.title}</h3>
                          <p className="text-sm text-slate-600">{page.pageNumber}페이지</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {warning ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              {warning}
                            </span>
                          ) : null}
                          {page.pageId !== "cover" ? (
                            <button
                              type="button"
                              onClick={() => onRemovePage?.(page.pageId)}
                              disabled={!canRemovePage}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                canRemovePage
                                  ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                                  : "border border-slate-200 bg-slate-100 text-slate-400"
                              }`}
                            >
                              이 페이지 제거
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              페이지 미리보기
                            </p>
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                              {renderPlannerLayoutPreview(page, slotPhotos, (slotIndex) =>
                                setSelectionTarget({ pageId: page.pageId, slotIndex }),
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-sm font-semibold text-slate-900">배치된 사진</p>
                            {slotPhotos.some(Boolean) ? (
                              <ul className="grid gap-2 text-sm text-slate-700">
                                {slotPhotos.map((photo, index) => (
                                  <li
                                    key={`${page.pageId}-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                  >
                                    {photo
                                      ? `${index + 1}번 슬롯: ${photo.caption}`
                                      : `${index + 1}번 슬롯: 비어 있음`}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-slate-600">
                                아직 배치된 사진이 없습니다.
                              </p>
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
                              value={page.note}
                              onChange={(event) => onSetPageNote?.(page.pageId, event.target.value)}
                              className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                              placeholder="이 페이지에서 강조할 설명을 적어주세요."
                            />
                          </label>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onAddPage}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 hover:text-slate-950"
                >
                  마지막 스프레드 아래에 페이지 추가
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
              선택된 사진이 있어야 페이지 미리보기를 만들 수 있습니다.
            </div>
          )}
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
                <p className="text-sm font-semibold text-slate-500">사진 선택</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {selectionTargetPage.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {selectionTargetPage.pageId === "cover"
                    ? "커버에 넣을 사진을 골라주세요."
                    : `${selectionTargetPage.title}의 ${(selectionTarget?.slotIndex ?? 0) + 1}번 슬롯에 넣을 사진을 골라주세요.`}
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

            {selectedPhotos.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(selectionTargetPage.pageId === "cover" ? selectedPhotos : spreadPhotoPool).map((photo) => (
                  <article
                    key={`${selectionTargetPage.pageId}-${photo.id}`}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <PhotoPreviewCard photo={photo} aspectClassName="aspect-[4/3]" />
                    <div className="grid gap-1 text-sm text-slate-700">
                      <strong className="text-base text-slate-950">{photo.caption}</strong>
                      <p>업로드: {photo.uploadedBy}</p>
                      <p>좋아요 {photo.likeCount}개</p>
                    </div>
                    <PrimaryAction
                      label={
                        selectionTargetPage.pageId === "cover"
                          ? "커버로 지정"
                          : `${selectionTargetPage.title} ${(selectionTarget?.slotIndex ?? 0) + 1}번에 배치`
                      }
                      onClick={() => handleSelectPhotoForSlot(photo.id)}
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
                먼저 사진 선택 단계에서 책에 넣을 사진을 골라주세요.
              </div>
            )}
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
  slotPhotos: Array<WorkflowPhoto | undefined>,
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
              sublabel={slotPhotos[0]?.caption ?? "커버 사진"}
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
            <p className="mt-2 text-sm font-semibold">제목과 부제가 크게 보이는 커버</p>
          </div>
          <LayoutSlot
            label="커버"
            className="min-h-0 bg-slate-100 text-slate-900"
            sublabel={slotPhotos[0]?.caption ?? "커버 사진"}
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
          sublabel={slotPhotos[0]?.caption ?? "커버 사진"}
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
          sublabel={slotPhotos[0]?.caption ?? "대표 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
          한 장의 사진을 강조하는 레이아웃입니다.
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
          sublabel={slotPhotos[0]?.caption ?? "첫 번째 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <LayoutSlot
          label="2"
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={slotPhotos[1]?.caption ?? "두 번째 사진"}
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
          sublabel={slotPhotos[0]?.caption ?? "메인 사진"}
          onClick={() => onSelectSlot(0)}
        />
        <div className="grid min-h-0 gap-3">
          <LayoutSlot
            label="2"
            className="min-h-0 flex-1 bg-slate-100 text-slate-900"
            sublabel={slotPhotos[1]?.caption ?? "보조 사진"}
            onClick={() => onSelectSlot(1)}
          />
          <LayoutSlot
            label="3"
            className="min-h-0 flex-1 border-dashed bg-white text-slate-500"
            sublabel={slotPhotos[2]?.caption ?? "선택 사항"}
            onClick={() => onSelectSlot(2)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-[320px] gap-3">
      <div className="grid min-h-0 gap-3 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-slate-900 px-4 py-5 text-sm text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Caption</p>
          <p className="mt-2 leading-6">
            설명 박스와 사진을 함께 보여주는 스프레드입니다.
          </p>
        </div>
        <LayoutSlot
          label="1"
          className="min-h-0 bg-slate-100 text-slate-900"
          sublabel={slotPhotos[0]?.caption ?? "대표 사진"}
          onClick={() => onSelectSlot(0)}
        />
      </div>
      <LayoutSlot
        label="2"
        className="min-h-0 bg-slate-100 text-slate-900"
        sublabel={slotPhotos[1]?.caption ?? "보조 사진"}
        onClick={() => onSelectSlot(1)}
      />
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

function buildPlannerPages(
  coverPhoto: WorkflowPhoto | undefined,
  spreadPhotoPool: WorkflowPhoto[],
  pageAssignments: Record<string, string[]>,
  pageLayouts: Record<string, string>,
  pageNotes: Record<string, string>,
): PlannerPageViewModel[] {
  const pages: PlannerPageViewModel[] = [];

  if (coverPhoto) {
    const pageId = "cover";
    const layout = pageLayouts[pageId] ?? "풀블리드 커버";
    const slotCount = getSlotCountForLayout(layout, true);
    const slotPhotoIds = normalizeSlotPhotoIds([coverPhoto.id], slotCount);

    pages.push({
      pageId,
      pageNumber: 1,
      title: "커버 미리보기",
      layout,
      note: pageNotes[pageId] ?? "대표 사진 한 장을 커버로 사용합니다.",
      slotCount,
      slotPhotoIds,
    });
  }

  const assignmentKeys = Object.keys(pageAssignments)
    .filter((pageId) => pageId.startsWith("spread-"))
    .sort((left, right) => Number(left.replace("spread-", "")) - Number(right.replace("spread-", "")));
  const generatedSpreadCount = Math.max(1, Math.ceil(Math.max(spreadPhotoPool.length, 1) / 2));
  const generatedKeys = Array.from({ length: generatedSpreadCount }, (_, index) => `spread-${index + 1}`);
  const spreadKeys = [...new Set([...generatedKeys, ...assignmentKeys])];

  spreadKeys.forEach((pageId, index) => {
    const layout = pageLayouts[pageId] ?? "균형 배치 2컷 구성";
    const slotCount = getSlotCountForLayout(layout, false);
    const slotPhotoIds = normalizeSlotPhotoIds(pageAssignments[pageId] ?? [], slotCount);

    pages.push({
      pageId,
      pageNumber: pages.length + 1,
      title: `Spread ${index + 1}`,
      layout,
      note:
        pageNotes[pageId] ??
        (slotCount > 1
          ? "사진 슬롯을 눌러 각 위치에 들어갈 사진을 골라주세요."
          : "한 장의 사진을 강조하는 페이지입니다."),
      slotCount,
      slotPhotoIds,
    });
  });

  return pages;
}

function normalizeSlotPhotoIds(photoIds: string[], slotCount: number): string[] {
  const next = [...photoIds];
  while (next.length < slotCount) {
    next.push("");
  }
  return next.slice(0, slotCount);
}

function getLayoutOptions(isCover: boolean): string[] {
  return isCover
    ? ["풀블리드 커버", "중앙 정렬 커버", "타이틀 강조 커버"]
    : ["균형 배치 2컷 구성", "단일 사진 강조 레이아웃", "콜라주 스타일", "캡션 강조 스프레드"];
}

function getSlotCountForLayout(layout: string, isCover: boolean): number {
  if (isCover || layout.includes("커버")) {
    return 1;
  }
  if (layout === "콜라주 스타일") {
    return 3;
  }
  if (layout === "단일 사진 강조 레이아웃") {
    return 1;
  }
  return 2;
}

function getPageWarning(layout: string, slotPhotoIds: string[]): string | null {
  const requiredSlots = getSlotCountForLayout(layout, layout.includes("커버"));
  const assignedCount = slotPhotoIds.filter(Boolean).length;

  if (assignedCount === 0) {
    return "사진이 아직 배치되지 않았습니다.";
  }

  if (assignedCount < requiredSlots) {
    return `이 레이아웃은 ${requiredSlots}개 슬롯 중 ${assignedCount}개만 채워져 있습니다.`;
  }

  return null;
}
