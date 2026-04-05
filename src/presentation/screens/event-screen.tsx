import type { ReactElement } from "react";

import {
  getPrototypePhotoWorkflowViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { PhotoWorkflowSection } from "./photo-workflow-section";

type EventScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
};

export function EventScreen({
  workspace,
}: EventScreenProps): ReactElement {
  const activeGroup = workspace.groups[0];
  const activeEvent = workspace.events[0];
  const photoWorkflow = getPrototypePhotoWorkflowViewModel(activeEvent?.id ?? "");

  return (
    <>
      <PageSection
        eyebrow="Event management"
        title="Event timeline"
        description="Capture milestones before moving into album selection."
      >
        <PrimaryAction label="Plan a new event" />
        <p>Active group</p>
        <p>{activeGroup?.name ?? "No active group"}</p>
        <ul>
          {workspace.events.map((event) => (
            <li key={event.id}>
              <strong>{event.name}</strong>
              <span> {event.groupName}</span>
              <span> {event.status}</span>
              <span> {event.photoCount} photos</span>
            </li>
          ))}
        </ul>
      </PageSection>
      <PhotoWorkflowSection workflow={photoWorkflow} />
    </>
  );
}
