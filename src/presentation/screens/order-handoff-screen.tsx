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
  workspace: PrototypeWorkspaceViewModel;
  orderEntry?: PrototypeOrderEntryViewModel;
  requestEstimate?: () => Promise<PrototypeSweetBookEstimate>;
  requestSubmit?: () => Promise<PrototypeSweetBookSubmitResult>;
};

export function OrderHandoffScreen({
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

  const canSubmitOrder = estimateResult?.status === "ready_for_order";

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
        <p>{activeOrderEntry.selectedCandidateCount} shortlisted photos ready</p>
        <p>{activeOrderEntry.activeEventName}</p>
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
        <ul>
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
