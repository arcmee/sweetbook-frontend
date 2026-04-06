import { useState, type ReactElement } from "react";

import type { PrototypeSweetBookEstimate } from "../../application/prototype-sweetbook-estimate";
import {
  getPrototypeOrderEntryViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { requestPrototypeSweetBookEstimate } from "../../data/prototype-api-client";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { StatePanel } from "../ui/state-panel";

type OrderHandoffScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
  requestEstimate?: () => Promise<PrototypeSweetBookEstimate>;
};

export function OrderHandoffScreen({
  workspace,
  requestEstimate = requestPrototypeSweetBookEstimate,
}: OrderHandoffScreenProps): ReactElement {
  const activeEvent = workspace.events[0];
  const orderEntry = getPrototypeOrderEntryViewModel(activeEvent?.id ?? "");
  const [isRunningEstimate, setIsRunningEstimate] = useState(false);
  const [estimateResult, setEstimateResult] =
    useState<PrototypeSweetBookEstimate | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  async function handleEstimateRequest(): Promise<void> {
    setIsRunningEstimate(true);
    setEstimateError(null);

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
        <p>{orderEntry.selectedCandidateCount} shortlisted photos ready</p>
        <p>{orderEntry.activeEventName}</p>
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
      </PageSection>
      <PageSection
        eyebrow="SweetBook handoff preview"
        title="SweetBook handoff preview"
        description={orderEntry.handoffSummary.note}
      >
        <p>{orderEntry.handoffSummary.bookFormat}</p>
        <ul>
          {orderEntry.handoffSummary.payloadSections.map((section) => (
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
