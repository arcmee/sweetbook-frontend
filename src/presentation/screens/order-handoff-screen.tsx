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
  coverPhotoCaption?: string;
  activeGroupName?: string;
  activeEventName?: string;
  estimatedPageCount?: number;
  isOwnerApproved?: boolean;
  pageLayouts?: Record<string, string>;
  pageNotes?: Record<string, string>;
  selectedPhotoCount?: number;
  selectedPhotoCaptions?: string[];
  workspace: PrototypeWorkspaceViewModel;
  orderEntry?: PrototypeOrderEntryViewModel;
  requestEstimate?: () => Promise<PrototypeSweetBookEstimate>;
  requestSubmit?: () => Promise<PrototypeSweetBookSubmitResult>;
};

export function OrderHandoffScreen({
  coverPhotoCaption,
  activeGroupName,
  activeEventName,
  estimatedPageCount,
  isOwnerApproved = false,
  pageLayouts = {},
  pageNotes = {},
  selectedPhotoCount,
  selectedPhotoCaptions = [],
  workspace,
  orderEntry,
  requestEstimate = requestPrototypeSweetBookEstimate,
  requestSubmit = requestPrototypeSweetBookSubmit,
}: OrderHandoffScreenProps): ReactElement {
  const activeEvent = workspace.events[0];
  const activeOrderEntry =
    orderEntry ?? getPrototypeOrderEntryViewModel(activeEvent?.id ?? "");
  const [isRunningEstimate, setIsRunningEstimate] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [estimateResult, setEstimateResult] =
    useState<PrototypeSweetBookEstimate | null>(null);
  const [submitResult, setSubmitResult] =
    useState<PrototypeSweetBookSubmitResult | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookQuantity, setBookQuantity] = useState("1");
  const [paymentName, setPaymentName] = useState("");
  const [paymentCardLastFour, setPaymentCardLastFour] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const quantity = Math.max(1, Number.parseInt(bookQuantity, 10) || 1);
  const unitPrice = estimateResult?.estimate.paidCreditAmount ?? 3410;
  const subtotal = unitPrice * quantity;
  const platformFee = quantity * 300;
  const totalDue = subtotal + platformFee;
  const fallbackSelectedPhotoCount =
    selectedPhotoCaptions.length > 0
      ? selectedPhotoCaptions.length
      : activeOrderEntry.selectedCandidateCount;
  const shortlistedCount =
    selectedPhotoCount && selectedPhotoCount > 0
      ? selectedPhotoCount
      : fallbackSelectedPhotoCount;
  const draftPageCount = estimatedPageCount ?? activeOrderEntry.selectedCandidateCount * 2;
  const pagePlan = buildOrderPagePlan(
    coverPhotoCaption,
    selectedPhotoCaptions,
    pageLayouts,
    pageNotes,
  );
  const readyPageCount = pagePlan.filter((page) => page.status === "Ready").length;
  const reviewPageCount = pagePlan.filter((page) => page.status === "Needs review").length;
  const pendingChecks = pagePlan
    .filter((page) => page.warning)
    .map((page) => `${page.title}: ${page.warning}`);
  const handoffChecklist = [
    {
      label: "Choose a cover photo",
      done: Boolean(coverPhotoCaption),
    },
    {
      label: "Keep at least 3 owner-approved photos",
      done: shortlistedCount >= 3,
    },
    {
      label: "Resolve all draft page warnings",
      done: reviewPageCount === 0,
    },
    {
      label: "Run the SweetBook estimate",
      done: estimateResult !== null,
    },
    {
      label: "Fill in recipient details",
      done: recipientName.trim().length > 0,
    },
    {
      label: "Enter payer name and card digits",
      done:
        paymentName.trim().length > 0 &&
        paymentCardLastFour.trim().length === 4,
    },
    {
      label: "Keep owner approval active for handoff",
      done: isOwnerApproved,
    },
  ];
  const nextBlocker =
    !coverPhotoCaption
      ? "Choose a cover photo in the album draft."
      : shortlistedCount < 3
        ? "Keep at least 3 owner-approved photos in the draft."
        : reviewPageCount > 0
          ? pendingChecks[0] ?? "Resolve the flagged draft pages."
          : !isOwnerApproved
            ? "Record owner approval in the album draft."
          : estimateResult === null
            ? "Run the SweetBook estimate."
            : recipientName.trim().length === 0
              ? "Fill in the recipient name."
              : paymentName.trim().length === 0 ||
                  paymentCardLastFour.trim().length !== 4
                ? "Enter the payer name and card digits."
                : null;
  const handoffStatus =
    nextBlocker === null
      ? "Ready to submit to SweetBook"
      : estimateResult === null
        ? "Estimate required before handoff"
        : "Blocked until remaining checks are resolved";

  async function handleEstimateRequest(): Promise<void> {
    setIsRunningEstimate(true);
    setEstimateError(null);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const result = await requestEstimate();
      setEstimateResult(result);
    } catch (error: unknown) {
      setEstimateError(error instanceof Error ? error.message : String(error));
      setEstimateResult(null);
    } finally {
      setIsRunningEstimate(false);
    }
  }

  async function handleSubmitRequest(): Promise<void> {
    setIsSubmittingOrder(true);
    setSubmitError(null);

    try {
      const result = await requestSubmit();
      setSubmitResult(result);
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
    recipientName.trim().length > 0;

  return (
    <>
      <PageSection
        eyebrow="Order entry"
        title="Order handoff"
        description="Prototype order entry keeps payment and checkout out of scope."
      >
        <PrimaryAction
          label={isRunningEstimate ? "Checking SweetBook estimate..." : "Start SweetBook order"}
          disabled={isRunningEstimate}
          onClick={handleEstimateRequest}
        />
        <p>Current group: {activeGroupName ?? "No active group"}</p>
        <p>Current event: {activeEventName ?? activeOrderEntry.activeEventName}</p>
        <p>{shortlistedCount} shortlisted photos ready</p>
        {coverPhotoCaption ? <p>Chosen cover: {coverPhotoCaption}</p> : null}
        {selectedPhotoCaptions.length > 0 ? (
          <p>Story spreads: {selectedPhotoCaptions.join(", ")}</p>
        ) : null}
        <p>Draft readiness: {readyPageCount} ready, {reviewPageCount} need review.</p>
        <p>
          Next blocker:{" "}
          {nextBlocker ?? "No blockers remain. This draft is ready for SweetBook submission."}
        </p>
        <div>
          <h3>Owner handoff checklist</h3>
          <ul>
            {handoffChecklist.map((item) => (
              <li key={item.label}>
                {item.done ? "Done" : "Pending"}: {item.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>SweetBook handoff summary</h3>
          <p>Status: {handoffStatus}</p>
          <p>Draft payload pages: {pagePlan.length}</p>
          <p>Estimated checkout total: {totalDue} KRW</p>
          <p>
            Estimate state:{" "}
            {estimateResult
              ? estimateResult.status === "ready_for_order"
                ? "Ready for submission"
                : "Blocked by credit top-up"
              : "Not started"}
          </p>
        </div>
        {reviewPageCount > 0 ? (
          <>
            <p>Resolve the flagged draft pages before this SweetBook handoff can be submitted.</p>
            <ul>
              {pendingChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            {isOwnerApproved
              ? "All draft pages are ready for SweetBook handoff."
              : "All draft pages are ready, but owner approval is still required before submission."}
          </p>
        )}
        <div>
          <h3>Checkout setup</h3>
          <p>Prepare the final SweetBook handoff before the owner sends the order.</p>
          <p>Cover candidate: {coverPhotoCaption ?? "Choose one in the album draft first."}</p>
          <p>Estimated draft pages: {draftPageCount}</p>
          <label>
            Book quantity
            <select
              name="bookQuantity"
              value={bookQuantity}
              onChange={(event) => setBookQuantity(event.target.value)}
            >
              <option value="1">1 copy</option>
              <option value="2">2 copies</option>
              <option value="3">3 copies</option>
              <option value="5">5 copies</option>
            </select>
          </label>
        </div>
        <div>
          <h3>Delivery details</h3>
          <label>
            Recipient name
            <input
              name="recipientName"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </label>
          <label>
            Delivery note
            <input
              name="deliveryNote"
              value={deliveryNote}
              onChange={(event) => setDeliveryNote(event.target.value)}
            />
          </label>
        </div>
        <div>
          <h3>Simple payment card</h3>
          <label>
            Payer name
            <input
              name="paymentName"
              value={paymentName}
              onChange={(event) => setPaymentName(event.target.value)}
            />
          </label>
          <label>
            Card last 4 digits
            <input
              name="paymentCardLastFour"
              inputMode="numeric"
              maxLength={4}
              value={paymentCardLastFour}
              onChange={(event) => setPaymentCardLastFour(event.target.value.replace(/\D/g, ""))}
            />
          </label>
        </div>
        <div>
          <h3>Checkout summary</h3>
          <p>Ready to submit once the SweetBook estimate and payment card are both complete.</p>
          <p>Owner-approved selection count: {shortlistedCount}</p>
          <p>SweetBook draft pages queued: {draftPageCount}</p>
          <p>SweetBook unit price: {unitPrice} KRW</p>
          <p>Quantity subtotal: {subtotal} KRW</p>
          <p>Prototype platform fee: {platformFee} KRW</p>
          <p>Total due today: {totalDue} KRW</p>
          {deliveryNote.trim().length > 0 ? <p>Delivery note: {deliveryNote}</p> : null}
        </div>
        {canSubmitOrder ? (
          <PrimaryAction
            label={isSubmittingOrder ? "Submitting SweetBook order..." : "Submit SweetBook order"}
            disabled={isSubmittingOrder}
            onClick={handleSubmitRequest}
          />
        ) : null}
        {isRunningEstimate ? (
          <StatePanel
            tone="loading"
            title="SweetBook estimate in progress"
            description="The backend is creating a sandbox book and checking the current order estimate."
          />
        ) : null}
        {estimateError ? (
          <StatePanel
            tone="error"
            title="SweetBook estimate failed"
            description={estimateError}
          />
        ) : null}
        {estimateResult ? (
          <StatePanel
            tone={
              estimateResult.status === "ready_for_order" ? "success" : "error"
            }
            title={
              estimateResult.status === "ready_for_order"
                ? "SweetBook estimate is ready"
                : "SweetBook credits need a top-up"
            }
            description={buildEstimateSummary(estimateResult)}
          />
        ) : null}
        {isSubmittingOrder ? (
          <StatePanel
            tone="loading"
            title="SweetBook order submission in progress"
            description="The backend is submitting the prepared sandbox order to SweetBook."
          />
        ) : null}
        {submitError ? (
          <StatePanel
            tone="error"
            title="SweetBook order submission failed"
            description={submitError}
          />
        ) : null}
        {submitResult ? (
          <StatePanel
            tone="success"
            title="SweetBook order submitted"
            description={`Sandbox order ${submitResult.order.orderUid} was submitted for ${submitResult.bookUid}.`}
          />
        ) : null}
      </PageSection>
      <PageSection
        eyebrow="SweetBook handoff preview"
        title="SweetBook handoff preview"
        description={activeOrderEntry.handoffSummary.note}
      >
        <p>{activeOrderEntry.handoffSummary.bookFormat}</p>
        <p>This draft now includes quantity selection, recipient details, and a simple payment card before submission.</p>
        <ul>
          {selectedPhotoCaptions.length > 0 ? (
            <li>{selectedPhotoCaptions.length} owner-approved photos</li>
          ) : null}
          {pagePlan.map((page) => (
            <li key={page.pageId}>
              <strong>{page.title}</strong>: {page.layout}
              <p>Status: {page.status}</p>
              {page.note ? ` - ${page.note}` : ""}
              {page.warning ? <p>Warning: {page.warning}</p> : null}
              <p>{page.photoCount} photo slot{page.photoCount === 1 ? "" : "s"} planned</p>
              <p>{page.photoCaptions.join(", ")}</p>
            </li>
          ))}
          {activeOrderEntry.handoffSummary.payloadSections.map((section) => (
            <li key={section}>{section}</li>
          ))}
        </ul>
      </PageSection>
    </>
  );
}

function buildEstimateSummary(estimate: PrototypeSweetBookEstimate): string {
  const currency = estimate.estimate.currency;
  const totalAmount = estimate.estimate.totalAmount;
  const paidCreditAmount = estimate.estimate.paidCreditAmount ?? totalAmount;
  const creditBalance = estimate.estimate.creditBalance ?? 0;

  if (estimate.status === "ready_for_order") {
    return `Sandbox estimate completed for ${estimate.bookUid}. ${paidCreditAmount} ${currency} is available for submission.`;
  }

  return `Sandbox estimate completed for ${estimate.bookUid}. Need ${paidCreditAmount} ${currency}, current balance ${creditBalance} ${currency}.`;
}

function buildOrderPagePlan(
  coverPhotoCaption: string | undefined,
  selectedPhotoCaptions: string[],
  pageLayouts: Record<string, string>,
  pageNotes: Record<string, string>,
): Array<{
  note: string;
  pageId: string;
  title: string;
  layout: string;
  photoCount: number;
  photoCaptions: string[];
  status: string;
  warning: string | null;
}> {
  const pages: Array<{
    note: string;
    pageId: string;
    title: string;
    layout: string;
    photoCount: number;
    photoCaptions: string[];
    status: string;
    warning: string | null;
  }> = [];

  if (coverPhotoCaption) {
    const note =
      pageNotes.cover ?? "Lead with the strongest event-defining moment on the cover.";
    pages.push({
      pageId: "cover",
      title: "Cover handoff",
      layout: pageLayouts.cover ?? "Full-bleed cover",
      note,
      photoCount: 1,
      photoCaptions: [coverPhotoCaption],
      status: "Ready",
      warning: note.trim().length === 0 ? "Add a cover note before handoff." : null,
    });
  }

  for (let index = 0; index < selectedPhotoCaptions.length; index += 2) {
    const spreadNumber = index / 2 + 1;
    const pageId = `spread-${spreadNumber}`;
    const spreadCaptions = selectedPhotoCaptions.slice(index, index + 2);
    const spreadCount = spreadCaptions.length;
    const layout =
      pageLayouts[pageId] ??
      (spreadCount > 1 ? "Balanced two-photo spread" : "Single-photo spotlight");
    const note =
      pageNotes[pageId] ??
      (spreadCount > 1
        ? "Use this spread to balance detail shots with group moments."
        : "Single-photo spread can spotlight a key memory beat.");
    const warning = getPageWarning(layout, spreadCount, note);
    pages.push({
      pageId,
      title: `Spread ${spreadNumber}`,
      layout,
      note,
      photoCount: spreadCount,
      photoCaptions: spreadCaptions,
      status: warning ? "Needs review" : "Ready",
      warning,
    });
  }

  return pages;
}

function getPageWarning(
  layout: string,
  photoCount: number,
  note: string,
): string | null {
  if (note.trim().length === 0) {
    return "Add an edit note before sending this page to SweetBook.";
  }

  if (layout === "Single-photo spotlight" && photoCount > 1) {
    return "Single-photo spotlight works best with one photo.";
  }

  if (layout === "Balanced two-photo spread" && photoCount < 2) {
    return "Balanced two-photo spread needs two photos to feel complete.";
  }

  if (layout === "Collage spread" && photoCount < 2) {
    return "Collage spread needs at least two photos.";
  }

  return null;
}
