import type { ChangeEvent, FormEvent, ReactElement } from "react";

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
  createEventTitle?: string;
  createPhotoCaption?: string;
  isCreatingEvent?: boolean;
  isCreatingPhoto?: boolean;
  isLikingPhoto?: boolean;
  onCreateEvent?: () => void | Promise<void>;
  onCreateEventTitleChange?: (value: string) => void;
  onCreatePhoto?: () => void | Promise<void>;
  onCreatePhotoCaptionChange?: (value: string) => void;
  onLikePhoto?: (photoId: string) => void | Promise<void>;
  onSelectEvent?: (eventId: string) => void;
  selectedEventId?: string;
  selectedGroupName?: string;
  workflow?: PrototypePhotoWorkflowViewModel;
};

export function EventScreen({
  workspace,
  createEventTitle = "",
  createPhotoCaption = "",
  isCreatingEvent = false,
  isCreatingPhoto = false,
  isLikingPhoto = false,
  onCreateEvent,
  onCreateEventTitleChange,
  onCreatePhoto,
  onCreatePhotoCaptionChange,
  onLikePhoto,
  onSelectEvent,
  selectedEventId,
  selectedGroupName,
  workflow,
}: EventScreenProps): ReactElement {
  const activeEvent =
    workspace.events.find((event) => event.id === selectedEventId) ?? workspace.events[0];
  const photoWorkflow =
    workflow ?? getPrototypePhotoWorkflowViewModel(activeEvent?.id ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreateEvent?.();
  }

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreateEventTitleChange?.(event.target.value);
  }

  return (
    <>
      <PageSection
        eyebrow="Event management"
        title="Event timeline"
        description="Capture milestones before moving into album selection."
      >
        <form onSubmit={handleSubmit}>
          <label>
            New event title
            <input
              name="eventTitle"
              value={createEventTitle}
              onChange={handleTitleChange}
            />
          </label>
          <PrimaryAction
            label={isCreatingEvent ? "Creating event..." : "Plan a new event"}
            disabled={isCreatingEvent || createEventTitle.trim().length === 0}
            type="submit"
          />
        </form>
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
      <PhotoWorkflowSection
        workflow={photoWorkflow}
        createPhotoCaption={createPhotoCaption}
        isCreatingPhoto={isCreatingPhoto}
        isLikingPhoto={isLikingPhoto}
        onCreatePhoto={onCreatePhoto}
        onCreatePhotoCaptionChange={onCreatePhotoCaptionChange}
        onLikePhoto={onLikePhoto}
      />
    </>
  );
}
