import { type ChangeEvent, type FormEvent, type ReactElement } from "react";

import type { PrototypeWorkspaceViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type GroupScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
  createGroupName?: string;
  isCreatingGroup?: boolean;
  onCreateGroup?: () => void | Promise<void>;
  onCreateGroupNameChange?: (value: string) => void;
  onSelectGroup?: (groupId: string) => void;
  selectedGroupId?: string;
};

export function GroupScreen({
  workspace,
  createGroupName = "",
  isCreatingGroup = false,
  onCreateGroup,
  onCreateGroupNameChange,
  onSelectGroup,
  selectedGroupId,
}: GroupScreenProps): ReactElement {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onCreateGroup?.();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>): void {
    onCreateGroupNameChange?.(event.target.value);
  }

  return (
    <PageSection
      eyebrow="Group management"
      title="Group workspace"
      description="Invite relatives and define who can upload photos."
    >
      <form onSubmit={handleSubmit}>
        <label>
          New group name
          <input
            name="groupName"
            value={createGroupName}
            onChange={handleNameChange}
          />
        </label>
        <PrimaryAction
          label={isCreatingGroup ? "Creating family group..." : "Create a family group"}
          disabled={isCreatingGroup || createGroupName.trim().length === 0}
          type="submit"
        />
      </form>
      <p>
        {workspace.groupSummary.totalGroups} groups, {workspace.groupSummary.totalMembers} members
      </p>
      <ul>
        {workspace.groups.map((group) => (
          <li key={group.id}>
            <button type="button" onClick={() => onSelectGroup?.(group.id)}>
              <strong>{group.name}</strong>
            </button>
            <span> {group.memberCount} members</span>
            <span> {group.eventCount} events</span>
            <span> {group.role}</span>
            <span>{selectedGroupId === group.id ? " Active group" : ""}</span>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
