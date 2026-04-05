export type GroupCardViewModel = {
  id: string;
  name: string;
  memberCount: number;
  role: string;
  eventCount: number;
};

export type EventCardViewModel = {
  id: string;
  name: string;
  groupName: string;
  status: "draft" | "collecting" | "ready";
  photoCount: number;
};

export type PrototypeWorkspaceViewModel = {
  groupSummary: {
    totalGroups: number;
    totalMembers: number;
  };
  groups: GroupCardViewModel[];
  events: EventCardViewModel[];
};

const prototypeWorkspaceViewModel: PrototypeWorkspaceViewModel = {
  groupSummary: {
    totalGroups: 2,
    totalMembers: 7,
  },
  groups: [
    {
      id: "group-han",
      name: "Han family",
      memberCount: 4,
      role: "Owner",
      eventCount: 2,
    },
    {
      id: "group-park",
      name: "Park cousins",
      memberCount: 3,
      role: "Editor",
      eventCount: 1,
    },
  ],
  events: [
    {
      id: "event-birthday",
      name: "First birthday album",
      groupName: "Han family",
      status: "collecting",
      photoCount: 124,
    },
    {
      id: "event-holiday",
      name: "Winter holiday trip",
      groupName: "Park cousins",
      status: "draft",
      photoCount: 36,
    },
  ],
};

export function getPrototypeWorkspaceViewModel(): PrototypeWorkspaceViewModel {
  return prototypeWorkspaceViewModel;
}
