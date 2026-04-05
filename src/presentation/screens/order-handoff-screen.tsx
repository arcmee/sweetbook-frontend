import type { ReactElement } from "react";

import {
  getPrototypeOrderEntryViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type OrderHandoffScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
};

export function OrderHandoffScreen({
  workspace,
}: OrderHandoffScreenProps): ReactElement {
  const activeEvent = workspace.events[0];
  const orderEntry = getPrototypeOrderEntryViewModel(activeEvent?.id ?? "");

  return (
    <>
      <PageSection
        eyebrow="Order entry"
        title="Order handoff"
        description="Prototype order entry keeps payment and checkout out of scope."
      >
        <PrimaryAction label="Start SweetBook order" />
        <p>{orderEntry.selectedCandidateCount} shortlisted photos ready</p>
        <p>{orderEntry.activeEventName}</p>
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
