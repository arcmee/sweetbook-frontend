import type { ReactElement } from "react";

import {
  getPrototypePhotoWorkflowViewModel,
  type PrototypePhotoWorkflowViewModel,
  type PrototypeWorkspaceViewModel,
} from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";
import { PhotoWorkflowSection } from "./photo-workflow-section";

type EventScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
  onCreateEvent?: () => void | Promise<void>;
  onSelectEvent?: (eventId: string) => void;
  selectedEventId?: string;
  selectedGroupName?: string;
  workflow?: PrototypePhotoWorkflowViewModel;
};

export function EventScreen({
  workspace,
  onCreateEvent,
  onSelectEvent,
  selectedEventId,
  selectedGroupName,
  workflow,
}: EventScreenProps): ReactElement {
  const activeEvent =
    workspace.events.find((event) => event.id === selectedEventId) ?? workspace.events[0];
  const photoWorkflow =
    workflow ?? getPrototypePhotoWorkflowViewModel(activeEvent?.id ?? "");

  return (
    <>
      <PageSection
        eyebrow="Event management"
        title="Event timeline"
        description="Capture milestones before moving into album selection."
      >
        <PrimaryAction label="Plan a new event" onClick={onCreateEvent} />
        <p>Active group</p>
        <p>{selectedGroupName ?? "No active group"}</p>
        <ul>
          {workspace.events.map((event) => (
            <li key={event.id}>
              <button type="button" onClick={() => onSelectEvent?.(event.id)}>
                <strong>{event.name}</strong>
              </button>
              <span> {event.groupName}</span>
              <span> {event.status}</span>
              <span> {event.photoCount} photos</span>
              <span>{selectedEventId === event.id ? " Active event" : ""}</span>
            </li>
          ))}
        </ul>
      </PageSection>
      <PhotoWorkflowSection workflow={photoWorkflow} />
    </>
  );
}
