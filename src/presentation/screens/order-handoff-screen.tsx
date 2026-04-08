import { useState, type ReactElement } from "react";

import type {
  PrototypeSweetBookEstimate,
  PrototypeSweetBookSubmitResult,
} from "../../application/prototype-sweetbook-estimate";
import {
  getPrototypeOrderEntryViewModel,
  type PrototypeOrderEntryViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import {
  requestPrototypeSweetBookEstimate,
  requestPrototypeSweetBookSubmit,
} from "../../data/prototype-api-client";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type OrderHandoffScreenProps = {
  activeEventId?: string;
  coverPhotoCaption?: string;
  activeGroupName?: string;
  activeEventName?: string;
  estimatedPageCount?: number;
  initialSubmitResult?: PrototypeSweetBookSubmitResult | null;
  isOwnerApproved?: boolean;
  onBack?: () => void;
  onSubmitSuccess?: (result: PrototypeSweetBookSubmitResult) => void;
  pageLayouts?: Record<string, string>;
  pageNotes?: Record<string, string>;
  selectedPhotoCount?: number;
  selectedPhotoCaptions?: string[];
  workspace: PrototypeWorkspaceViewModel;
  orderEntry?: PrototypeOrderEntryViewModel;
  requestEstimate?: (input: { eventId: string }) => Promise<PrototypeSweetBookEstimate>;
  requestSubmit?: (input: { eventId: string }) => Promise<PrototypeSweetBookSubmitResult>;
};

type OrderPagePreview = {
  pageId: string;
  title: string;
  layout: string;
  note: string;
  warning: string | null;
  photoCaptions: string[];
};

export function OrderHandoffScreen({
  activeEventId,
  coverPhotoCaption,
  activeGroupName,
  activeEventName,
  estimatedPageCount,
  initialSubmitResult = null,
  isOwnerApproved = false,
  onBack,
  onSubmitSuccess,
  pageLayouts = {},
  pageNotes = {},
  selectedPhotoCount,
  selectedPhotoCaptions = [],
  workspace,
  orderEntry,
  requestEstimate = requestPrototypeSweetBookEstimate,
  requestSubmit = requestPrototypeSweetBookSubmit,
}: OrderHandoffScreenProps): ReactElement {
  const activeEvent = workspace.events.find((event) => event.id === activeEventId) ?? workspace.events[0];
  const activeOrderEntry = orderEntry ?? getPrototypeOrderEntryViewModel(activeEvent?.id ?? "");
  const operationSummary = activeOrderEntry.operationSummary ?? {
    stage: activeOrderEntry.selectedCandidateCount > 0 ? "ready_for_handoff" : "blocked",
    label: activeOrderEntry.selectedCandidateCount > 0 ? "전달 준비 가능" : "전달 준비 전 단계",
    detail:
      activeOrderEntry.selectedCandidateCount > 0
        ? "오너 검토가 끝났다면 SweetBook 주문 단계로 계속 진행할 수 있습니다."
        : "SweetBook 작업으로 들어가기 전에 더 많은 사진 선택과 정리가 필요합니다.",
  };
  const readinessSummary = activeOrderEntry.readinessSummary ?? {
    minimumSelectedPhotoCount: 3,
    selectedPhotoCount: activeOrderEntry.selectedCandidateCount,
    meetsMinimumPhotoCount: activeOrderEntry.selectedCandidateCount >= 3,
    nextSuggestedStep:
      activeOrderEntry.selectedCandidateCount >= 3
        ? "페이지 경고와 오너 확인을 모두 마친 뒤 주문으로 넘어가세요."
        : "사진을 3장 이상 선택해야 SweetBook 주문을 진행할 수 있습니다.",
  };

  const [isRunningEstimate, setIsRunningEstimate] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [estimateResult, setEstimateResult] = useState<PrototypeSweetBookEstimate | null>(null);
  const [submitResult, setSubmitResult] = useState<PrototypeSweetBookSubmitResult | null>(
    initialSubmitResult,
  );
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookQuantity, setBookQuantity] = useState("1");
  const [paymentName, setPaymentName] = useState("");
  const [paymentCardLastFour, setPaymentCardLastFour] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [confirmDraftPayload, setConfirmDraftPayload] = useState(false);
  const [confirmDeliveryDetails, setConfirmDeliveryDetails] = useState(false);
  const [confirmPaymentSummary, setConfirmPaymentSummary] = useState(false);
  const [isSelectedPhotosModalOpen, setIsSelectedPhotosModalOpen] = useState(false);

  const quantity = Math.max(1, Number.parseInt(bookQuantity, 10) || 1);
  const unitPrice = estimateResult?.estimate.paidCreditAmount ?? 3410;
  const subtotal = unitPrice * quantity;
  const platformFee = quantity * 300;
  const totalDue = subtotal + platformFee;

  const backendReviewSummary = activeOrderEntry.reviewSummary;
  const ownerApprovalMissing =
    !isOwnerApproved && (backendReviewSummary?.ownerApprovalRequired ?? true);
  const fallbackSelectedPhotoCount =
    selectedPhotoCaptions.length > 0
      ? selectedPhotoCaptions.length
      : activeOrderEntry.selectedCandidateCount;
  const shortlistedCount =
    selectedPhotoCount && selectedPhotoCount > 0 ? selectedPhotoCount : fallbackSelectedPhotoCount;
  const draftPageCount =
    backendReviewSummary?.draftPageCount ?? estimatedPageCount ?? activeOrderEntry.selectedCandidateCount * 2;

  const pagePlan = buildOrderPagePlan(
    coverPhotoCaption,
    selectedPhotoCaptions,
    pageLayouts,
    pageNotes,
  );
  const plannerPages = activeOrderEntry.handoffSummary.plannerPages ?? [];
  const handoffPagePlan = plannerPages.length > 0 ? plannerPages : pagePlan;
  const reviewPageCount = handoffPagePlan.filter((page) => page.warning).length;
  const pendingChecks = handoffPagePlan
    .filter((page) => page.warning)
    .map((page) => `${page.title}: ${page.warning}`);

  const handoffChecklist = [
    { label: "커버 사진 정하기", done: Boolean(coverPhotoCaption) },
    {
      label: `사진 ${readinessSummary.minimumSelectedPhotoCount}장 이상 선택하기`,
      done: shortlistedCount >= readinessSummary.minimumSelectedPhotoCount,
    },
    { label: "검토가 필요한 페이지 모두 해결하기", done: reviewPageCount === 0 },
    { label: "SweetBook 견적 확인하기", done: estimateResult !== null },
    { label: "수령인 정보 입력하기", done: recipientName.trim().length > 0 },
    {
      label: "결제자 이름과 카드 끝 4자리 입력하기",
      done: paymentName.trim().length > 0 && paymentCardLastFour.trim().length === 4,
    },
    { label: "오너 확인 완료하기", done: isOwnerApproved },
    { label: "초안 구성 확인하기", done: confirmDraftPayload },
    { label: "배송 정보 확인하기", done: confirmDeliveryDetails },
    { label: "결제 요약 확인하기", done: confirmPaymentSummary },
  ];

  const nextBlocker =
    !coverPhotoCaption
      ? "책 구성 단계에서 커버 사진을 먼저 정해주세요."
      : shortlistedCount < readinessSummary.minimumSelectedPhotoCount
        ? `사진을 최소 ${readinessSummary.minimumSelectedPhotoCount}장 이상 선택해야 합니다.`
        : reviewPageCount > 0
          ? pendingChecks[0] ?? "검토가 필요한 페이지를 먼저 해결해주세요."
          : ownerApprovalMissing
            ? "책 구성 단계에서 오너 확인을 완료해야 합니다."
            : estimateResult === null
              ? "SweetBook 견적을 먼저 확인해주세요."
              : recipientName.trim().length === 0
                ? "수령인 이름을 입력해주세요."
                : paymentName.trim().length === 0 || paymentCardLastFour.trim().length !== 4
                  ? "결제자 이름과 카드 끝 4자리를 입력해주세요."
                  : !confirmDraftPayload
                    ? "초안 구성 확인 체크가 필요합니다."
                    : !confirmDeliveryDetails
                      ? "배송 정보 확인 체크가 필요합니다."
                      : !confirmPaymentSummary
                        ? "결제 요약 확인 체크가 필요합니다."
                        : null;

  const handoffStatus =
    submitResult
      ? "SweetBook 작업 완료"
      : nextBlocker === null
        ? operationSummary.label
        : estimateResult === null
          ? "견적 확인 전"
          : "추가 확인 필요";

  async function handleEstimateRequest(): Promise<void> {
    const targetEventId = activeEventId ?? activeOrderEntry.activeEventId;
    if (!targetEventId) {
      setEstimateError("현재 이벤트가 없어 견적을 실행할 수 없습니다.");
      return;
    }

    setIsRunningEstimate(true);
    setEstimateError(null);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const result = await requestEstimate({ eventId: targetEventId });
      setEstimateResult(result);
    } catch (error: unknown) {
      setEstimateError(error instanceof Error ? error.message : String(error));
      setEstimateResult(null);
    } finally {
      setIsRunningEstimate(false);
    }
  }

  async function handleSubmitRequest(): Promise<void> {
    const targetEventId = activeEventId ?? activeOrderEntry.activeEventId;
    if (!targetEventId) {
      setSubmitError("현재 이벤트가 없어 SweetBook 전달을 실행할 수 없습니다.");
      return;
    }

    setIsSubmittingOrder(true);
    setSubmitError(null);

    try {
      const result = await requestSubmit({ eventId: targetEventId });
      setSubmitResult(result);
      onSubmitSuccess?.(result);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : String(error));
      setSubmitResult(null);
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  const canSubmitOrder =
    estimateResult?.status === "ready_for_order" &&
    reviewPageCount === 0 &&
    isOwnerApproved &&
    paymentName.trim().length > 0 &&
    paymentCardLastFour.trim().length === 4 &&
    recipientName.trim().length > 0 &&
    confirmDraftPayload &&
    confirmDeliveryDetails &&
    confirmPaymentSummary;

  return (
    <div className="grid gap-6">
      <PageSection
        eyebrow="3단계"
        title="주문 진행"
        description="책 구성을 확인한 뒤 견적과 배송·결제 정보를 입력하고 SweetBook 주문을 진행합니다."
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-2">
              <p className="text-sm text-slate-600">
                현재 그룹: {activeGroupName ?? "선택된 그룹이 없습니다"}
              </p>
              <p className="text-sm text-slate-600">
                현재 이벤트: {activeEventName ?? activeOrderEntry.activeEventName}
              </p>
              <p className="text-base leading-7 text-slate-700">{operationSummary.detail}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="작업 상태" value={handoffStatus} />
              <button
                type="button"
                onClick={() => setIsSelectedPhotosModalOpen(true)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-100"
              >
                <p className="text-sm text-slate-500">선택된 사진</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{shortlistedCount}장</p>
                <p className="mt-2 text-xs text-slate-500">눌러서 사진 목록 보기</p>
              </button>
              <SummaryCard label="초안 페이지" value={`${draftPageCount}장`} />
              <SummaryCard label="예상 결제 금액" value={`${totalDue} KRW`} />
            </div>

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <h3 className="text-sm font-semibold text-slate-900">다음 확인 사항</h3>
              <p className="text-sm text-slate-700">
                {nextBlocker ?? "모든 확인이 끝났습니다. 주문을 제출할 수 있습니다."}
              </p>
            </div>

            {!submitResult ? (
              <div className="flex flex-wrap gap-3">
                <PrimaryAction label="이전: 책 구성 확인" onClick={onBack} />
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-2">
              <h3 className="text-lg font-semibold text-slate-950">주문 체크리스트</h3>
              <ul className="grid gap-2 text-sm text-slate-700">
                {handoffChecklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span className={item.done ? "text-emerald-600" : "text-slate-400"}>
                      {item.done ? "완료" : "대기"}
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <h3 className="text-sm font-semibold text-slate-900">SweetBook 작업 요약</h3>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p>커버: {activeOrderEntry.handoffSummary.coverCaption ?? coverPhotoCaption ?? "미정"}</p>
                <p>
                  스프레드 수: {activeOrderEntry.handoffSummary.spreadCount || Math.max(0, handoffPagePlan.length - 1)}
                </p>
                <p>
                  payload 페이지 수: {activeOrderEntry.handoffSummary.draftPayloadPageCount || handoffPagePlan.length}
                </p>
                <p>검토 경고 페이지: {backendReviewSummary?.flaggedDraftPageCount ?? 0}장</p>
              </div>
            </div>

            <PrimaryAction
              label={isRunningEstimate ? "SweetBook 견적 확인 중..." : "SweetBook 견적 확인"}
              disabled={isRunningEstimate}
              onClick={handleEstimateRequest}
            />
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="주문 정보"
        title="배송과 결제 정보 입력"
        description="수량, 수령인, 결제 정보를 입력하고 최종 확인을 마치면 주문을 제출할 수 있습니다."
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">기본 설정</h3>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              책 수량
              <select
                name="bookQuantity"
                value={bookQuantity}
                onChange={(event) => setBookQuantity(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}권
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              수령인 이름
              <input
                type="text"
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                placeholder="예: 김민지"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              배송 메모
              <textarea
                value={deliveryNote}
                onChange={(event) => setDeliveryNote(event.target.value)}
                className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                placeholder="배송 시 참고할 메모를 적어주세요."
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">결제 정보</h3>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              결제자 이름
              <input
                type="text"
                value={paymentName}
                onChange={(event) => setPaymentName(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                placeholder="예: 김민지"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              카드 끝 4자리
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={paymentCardLastFour}
                onChange={(event) =>
                  setPaymentCardLastFour(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-500"
                placeholder="1234"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p>권당 금액: {unitPrice} KRW</p>
              <p>플랫폼 수수료: {platformFee} KRW</p>
              <p className="mt-2 text-base font-semibold text-slate-950">총 결제 금액: {totalDue} KRW</p>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="최종 확인"
        title="제출 전 확인"
        description="아래 항목을 모두 확인하면 SweetBook 주문 제출이 열립니다."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={confirmDraftPayload} onChange={() => setConfirmDraftPayload((value) => !value)} />
              <span>초안 구성과 페이지 미리보기를 확인했습니다.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={confirmDeliveryDetails} onChange={() => setConfirmDeliveryDetails((value) => !value)} />
              <span>배송 정보가 정확한지 확인했습니다.</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={confirmPaymentSummary} onChange={() => setConfirmPaymentSummary((value) => !value)} />
              <span>결제 요약과 금액을 확인했습니다.</span>
            </label>
          </div>

          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <PrimaryAction
              label={isSubmittingOrder ? "SweetBook 주문 제출 중..." : "SweetBook 주문 제출"}
              disabled={!canSubmitOrder || isSubmittingOrder}
              onClick={handleSubmitRequest}
            />
            {estimateError ? (
              <StatePanel tone="error" title="견적 확인 실패" description={estimateError} />
            ) : null}
            {submitError ? (
              <StatePanel tone="error" title="주문 제출 실패" description={submitError} />
            ) : null}
            {estimateResult ? (
              <StatePanel
                tone={estimateResult.status === "ready_for_order" ? "success" : "empty"}
                title={
                  estimateResult.status === "ready_for_order"
                    ? "SweetBook 주문 가능"
                    : "크레딧이 부족합니다"
                }
                description={`결제 예정 금액 ${estimateResult.estimate.paidCreditAmount} KRW · 현재 잔액 ${estimateResult.estimate.currentCreditBalanceAmount} KRW`}
              />
            ) : null}
            {submitResult ? (
              <StatePanel
                tone="success"
                title="SweetBook 주문이 제출되었습니다"
                description={`주문 ID ${submitResult.order.orderUid} · 책 ID ${submitResult.bookUid}`}
              />
            ) : null}
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="전달 미리보기"
        title="최종 전달 구성"
        description="실제로 SweetBook으로 넘어갈 커버와 페이지 구성을 확인합니다."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {handoffPagePlan.map((page) => (
            <div key={page.pageId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{page.layout}</p>
                  <h3 className="text-lg font-semibold text-slate-950">{page.title}</h3>
                </div>
                {page.warning ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {page.warning}
                  </span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <p>메모: {page.note || "메모 없음"}</p>
                <p>사진 수: {page.photoCaptions.length}장</p>
                {page.photoCaptions.length > 0 ? (
                  <ul className="grid gap-2">
                    {page.photoCaptions.map((caption) => (
                      <li key={`${page.pageId}-${caption}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        {caption}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>연결된 사진이 없습니다.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {isSelectedPhotosModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          onClick={() => setIsSelectedPhotosModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">선택된 사진</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">책에 포함된 사진 목록</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectedPhotosModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                닫기
              </button>
            </div>

            {selectedPhotoCaptions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedPhotoCaptions.map((caption) => {
                  const photo = (workspace.photoWorkflows ?? [])
                    .flatMap((item) => item.photos)
                    .find((item) => item.caption === caption);

                  return (
                    <article
                      key={caption}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      {photo?.assetUrl ? (
                        <img
                          src={photo.assetUrl}
                          alt={`${caption} 미리보기`}
                          className="aspect-[4/3] w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white text-sm text-slate-500">
                          이미지 미리보기가 없습니다.
                        </div>
                      )}
                      <div className="grid gap-1 text-sm text-slate-700">
                        <strong className="text-base text-slate-950">{caption}</strong>
                        <p>업로드: {photo?.uploadedBy ?? "알 수 없음"}</p>
                        <p>좋아요 {photo?.likeCount ?? 0}개</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <StatePanel
                tone="empty"
                title="아직 선택된 사진이 없습니다"
                description="책 구성 단계에서 사진을 먼저 선택해주세요."
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildOrderPagePlan(
  coverPhotoCaption: string | undefined,
  selectedPhotoCaptions: string[],
  pageLayouts: Record<string, string>,
  pageNotes: Record<string, string>,
): OrderPagePreview[] {
  const pages: OrderPagePreview[] = [];

  if (coverPhotoCaption) {
    pages.push({
      pageId: "cover",
      title: "커버 전달",
      layout: pageLayouts.cover ?? "풀블리드 커버",
      note: pageNotes.cover ?? "대표 사진 한 장을 커버로 전달합니다.",
      warning: null,
      photoCaptions: [coverPhotoCaption],
    });
  }

  const spreadPhotos = selectedPhotoCaptions.filter((caption) => caption !== coverPhotoCaption);
  for (let index = 0; index < spreadPhotos.length; index += 2) {
    const photos = spreadPhotos.slice(index, index + 2);
    const spreadNumber = Math.floor(index / 2) + 1;
    const pageId = `spread-${spreadNumber}`;
    const layout = pageLayouts[pageId] ?? (photos.length > 1 ? "균형 배치 2컷 구성" : "단일 사진 강조 레이아웃");
    const note =
      pageNotes[pageId] ??
      (photos.length > 1
        ? "두 장의 사진이 자연스럽게 이어지도록 구성합니다."
        : "한 장의 사진을 강조하는 페이지입니다.");

    pages.push({
      pageId,
      title: `내지 ${spreadNumber}`,
      layout,
      note,
      warning: null,
      photoCaptions: photos,
    });
  }

  return pages;
}

function SummaryCard({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
