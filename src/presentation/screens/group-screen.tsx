import { type ReactElement } from "react";

import type { PrototypeWorkspaceViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type GroupScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
  onCreateGroup?: () => void | Promise<void>;
  onSelectGroup?: (groupId: string) => void;
  selectedGroupId?: string;
};

export function GroupScreen({
  workspace,
  onCreateGroup,
  onSelectGroup,
  selectedGroupId,
}: GroupScreenProps): ReactElement {
  return (
    <PageSection
      eyebrow="Group management"
      title="Group workspace"
      description="Invite relatives and define who can upload photos."
    >
      <PrimaryAction label="Create a family group" onClick={onCreateGroup} />
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
