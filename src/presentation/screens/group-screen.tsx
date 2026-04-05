import type { ReactElement } from "react";

import type { PrototypeWorkspaceViewModel } from "../../application/prototype-workspace";
import { PageSection } from "../ui/page-section";
import { PrimaryAction } from "../ui/primary-action";

type GroupScreenProps = {
  workspace: PrototypeWorkspaceViewModel;
};

export function GroupScreen({
  workspace,
}: GroupScreenProps): ReactElement {
  return (
    <PageSection
      eyebrow="Group management"
      title="Group workspace"
      description="Invite relatives and define who can upload photos."
    >
      <PrimaryAction label="Create a family group" />
      <p>
        {workspace.groupSummary.totalGroups} groups, {workspace.groupSummary.totalMembers} members
      </p>
      <ul>
        {workspace.groups.map((group) => (
          <li key={group.id}>
            <strong>{group.name}</strong>
            <span> {group.memberCount} members</span>
            <span> {group.eventCount} events</span>
            <span> {group.role}</span>
          </li>
        ))}
      </ul>
    </PageSection>
  );
}
