// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../src/presentation/app-shell";
import { LoginScreen } from "../src/presentation/screens/login-screen";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe("prototype auth ui", () => {
  const containers: HTMLDivElement[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();

    while (containers.length > 0) {
      const container = containers.pop();
      container?.remove();
    }

    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  it("logs in with the demo credentials and reports the session", async () => {
    const requestLogin = vi.fn().mockResolvedValue({
      token: "ptok_123",
      user: {
        userId: "user-demo",
        username: "demo",
        displayName: "SweetBook Demo User",
        role: "owner",
      },
    });
    const onLogin = vi.fn();
    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(LoginScreen, { requestLogin, onLogin }));
    });

    const form = container.querySelector("form");
    expect(container.textContent).toContain("demo / sweetbook123!");

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(requestLogin).toHaveBeenCalledWith({
      username: "demo",
      password: "sweetbook123!",
    });
    expect(onLogin).toHaveBeenCalledWith({
      token: "ptok_123",
      user: expect.objectContaining({
        displayName: "SweetBook Demo User",
      }),
    });
  });

  it("shows the login screen when a protected route has no saved session", async () => {
    window.history.replaceState({}, "", "/app/orders");

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    expect(container.textContent).toContain("Sign in to SweetBook");
    expect(container.textContent).not.toContain("Order handoff");
  });

  it("restores the saved session and refreshes the workspace from the backend snapshot", async () => {
    window.history.replaceState({}, "", "/app/groups");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 2,
            },
            groups: [
              {
                id: "group-db",
                name: "Database group",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-db",
                name: "Database event",
                groupName: "Database group",
                status: "ready",
                photoCount: 12,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-db",
              activeEventName: "Database event",
              uploadState: {
                pendingCount: 0,
                uploadedCount: 12,
                helperText: "Loaded from backend",
              },
              photos: [],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/prototype/auth/session?token=ptok_saved",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/prototype/workspace");
    expect(container.textContent).toContain("Database group");
    expect(container.textContent).toContain("Notification center");
    expect(container.textContent).toContain("Group invitations");
    expect(container.textContent).toContain("Voting reminders");
  });

  it("creates a group and refreshes the workspace snapshot", async () => {
    window.history.replaceState({}, "", "/app");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 2,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [],
          },
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 2,
              totalMembers: 3,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
              {
                id: "group-created-2",
                name: "Cho family",
                memberCount: 1,
                role: "Owner",
                eventCount: 0,
              },
            ],
            events: [],
          },
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const createButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Create a family group",
    );
    const groupNameInput = container.querySelector(
      'input[name="groupName"]',
    ) as HTMLInputElement | null;

    await act(async () => {
      if (groupNameInput) {
        setInputValue(groupNameInput, "Cho family");
      }
    });

    await act(async () => {
      createButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/prototype/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Cho family",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/prototype/workspace");
    expect(container.textContent).toContain("Cho family");
    expect(container.textContent).toContain("Workspace updated");
    expect(container.textContent).toContain("Created group Cho family.");
  });

  it("switches the active group and event context when the user selects a different item", async () => {
    window.history.replaceState({}, "", "/app");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
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
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [
                {
                  id: "photo-family",
                  caption: "Family portrait",
                  uploadedBy: "Joon",
                  likeCount: 9,
                  likedByViewer: false,
                },
              ],
            },
            {
              activeEventId: "event-holiday",
              activeEventName: "Winter holiday trip",
              uploadState: {
                pendingCount: 1,
                uploadedCount: 36,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [
                {
                  id: "photo-cabin",
                  caption: "Cabin arrival",
                  uploadedBy: "Soo",
                  likeCount: 4,
                  likedByViewer: false,
                },
              ],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(AppShell, {
          initialSession: null,
        }),
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Han family");
    expect(container.textContent).toContain("First birthday album");

    const holidayButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Winter holiday trip"),
    );

    await act(async () => {
      holidayButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Park cousins");
    expect(container.textContent).toContain("Winter holiday trip");
    expect(container.textContent).toContain("Cabin arrival");
  });

  it("creates an event from the typed input and refreshes the workspace snapshot", async () => {
    window.history.replaceState({}, "", "/app/groups");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 2,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
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
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 2,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 2,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                canVote: true,
                photoCount: 124,
              },
              {
                id: "event-created-2",
                name: "Graduation album",
                groupName: "Han family",
                status: "draft",
                canVote: false,
                photoCount: 0,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [],
            },
            {
              activeEventId: "event-created-2",
              activeEventName: "Graduation album",
              uploadState: {
                pendingCount: 0,
                uploadedCount: 0,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const eventTitleInput = container.querySelector(
      'input[name="eventTitle"]',
    ) as HTMLInputElement | null;
    const eventDescriptionInput = container.querySelector(
      'textarea[name="eventDescription"]',
    ) as HTMLTextAreaElement | null;
    const votingStartsAtInput = container.querySelector(
      'input[name="eventVotingStartsAt"]',
    ) as HTMLInputElement | null;
    const votingEndsAtInput = container.querySelector(
      'input[name="eventVotingEndsAt"]',
    ) as HTMLInputElement | null;
    const createButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Create event in this group",
    );

    await act(async () => {
      if (eventTitleInput) {
        setInputValue(eventTitleInput, "Graduation album");
      }
      if (eventDescriptionInput) {
        setTextAreaValue(
          eventDescriptionInput,
          "Collect the graduation day highlights before the family vote closes.",
        );
      }
      if (votingStartsAtInput) {
        setInputValue(votingStartsAtInput, "2026-04-10T09:00");
      }
      if (votingEndsAtInput) {
        setInputValue(votingEndsAtInput, "2026-04-17T09:00");
      }
    });

    await act(async () => {
      createButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/prototype/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupId: "group-han",
        title: "Graduation album",
        description: "Collect the graduation day highlights before the family vote closes.",
        votingStartsAt: "2026-04-10T00:00:00.000Z",
        votingEndsAt: "2026-04-17T00:00:00.000Z",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/prototype/workspace");
    expect(container.textContent).toContain("Graduation album");
    expect(container.textContent).toContain("Created event Graduation album.");
  });

  it("searches and invites a member from the group page", async () => {
    window.history.replaceState({}, "", "/app/groups");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 2,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [],
          },
          groupMembers: [
            {
              groupId: "group-han",
              userId: "user-demo",
              displayName: "SweetBook Demo User",
              role: "Owner",
            },
            {
              groupId: "group-han",
              userId: "user-mina",
              displayName: "Mina",
              role: "Editor",
            },
          ],
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            userId: "user-haru",
            username: "haru",
            displayName: "Haru",
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 3,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 3,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [],
          },
          groupMembers: [
            {
              groupId: "group-han",
              userId: "user-demo",
              displayName: "SweetBook Demo User",
              role: "Owner",
            },
            {
              groupId: "group-han",
              userId: "user-mina",
              displayName: "Mina",
              role: "Editor",
            },
            {
              groupId: "group-han",
              userId: "user-haru",
              displayName: "Haru",
              role: "Contributor",
            },
          ],
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const openInviteButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Invite member by ID",
    );

    await act(async () => {
      openInviteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const inviteQueryInput = container.querySelector(
      'input[name="inviteQuery"]',
    ) as HTMLInputElement | null;
    const searchButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Search members",
    );

    await act(async () => {
      if (inviteQueryInput) {
        setInputValue(inviteQueryInput, "haru");
      }
    });

    await act(async () => {
      searchButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const inviteButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Invite",
    );

    await act(async () => {
      inviteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/prototype/users/search?q=haru");
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/prototype/groups/group-han/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "user-haru",
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(5, "/api/prototype/workspace");
    expect(container.textContent).toContain("Haru");
    expect(container.textContent).toContain("Invited user-haru to Han family.");
  });

  it("changes the prototype password from the account panel", async () => {
    window.history.replaceState({}, "", "/app");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: {
              totalGroups: 1,
              totalMembers: 2,
            },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                canVote: true,
                photoCount: 2,
              },
            ],
          },
          pendingInvitations: [
            {
              invitationId: "invite-kim",
              groupName: "Kim family moments",
              invitedByDisplayName: "Sena",
            },
          ],
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 0,
                uploadedCount: 2,
                helperText: "Loaded from backend",
              },
              photos: [
                {
                  id: "photo-family",
                  caption: "Family portrait",
                  uploadedBy: "Mina",
                  likeCount: 0,
                  likedByViewer: false,
                },
              ],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const currentPasswordInput = container.querySelector(
      'input[name="currentPassword"]',
    ) as HTMLInputElement | null;
    const nextPasswordInput = container.querySelector(
      'input[name="nextPassword"]',
    ) as HTMLInputElement | null;
    const changePasswordButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Change password",
    );

    await act(async () => {
      if (currentPasswordInput) {
        setInputValue(currentPasswordInput, "sweetbook123!");
      }
      if (nextPasswordInput) {
        setInputValue(nextPasswordInput, "sweetbook456!");
      }
    });

    await act(async () => {
      changePasswordButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/prototype/account/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: "sweetbook123!",
        nextPassword: "sweetbook456!",
      }),
    });
    expect(container.textContent).toContain("Updated your prototype password.");
    expect(container.textContent).toContain("Kim family moments");
    expect(container.textContent).toContain("You still need to vote");
  });

  it("creates a photo and refreshes the workflow snapshot", async () => {
    window.history.replaceState({}, "", "/app/events");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                canVote: true,
                photoCount: 124,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 201 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                canVote: true,
                photoCount: 125,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 125,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [
                {
                  id: "photo-created-4",
                  caption: "Balloon arch",
                  uploadedBy: "SweetBook Demo User",
                  likeCount: 0,
                  likedByViewer: false,
                },
              ],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const photoCaptionInput = container.querySelector(
      'input[name="photoCaption"]',
    ) as HTMLInputElement | null;
    const photoFileInput = container.querySelector(
      'input[name="photoFile"]',
    ) as HTMLInputElement | null;
    const createPhotoButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Upload event photo",
    );
    const photoFile = new File(["demo-image"], "balloon-arch.jpg", {
      type: "image/jpeg",
    });

    await act(async () => {
      if (photoCaptionInput) {
        setInputValue(photoCaptionInput, "Balloon arch");
      }
      if (photoFileInput) {
        setInputFiles(photoFileInput, [photoFile]);
      }
    });

    await act(async () => {
      createPhotoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const uploadCall = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(uploadCall[0]).toBe("/api/prototype/photo-uploads");
    expect(uploadCall[1].method).toBe("POST");
    expect(uploadCall[1].body).toBeInstanceOf(FormData);
    expect((uploadCall[1].body as FormData).get("eventId")).toBe("event-birthday");
    expect((uploadCall[1].body as FormData).get("caption")).toBe("Balloon arch");
    expect((uploadCall[1].body as FormData).get("file")).toBe(photoFile);
    expect(container.textContent).toContain("Uploaded photo Balloon arch.");
    expect(container.textContent).toContain("125 already in the event");
  });

  it("likes a photo and refreshes the workflow snapshot", async () => {
    window.history.replaceState({}, "", "/app/events");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                canVote: true,
                photoCount: 124,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [
                {
                  id: "photo-family",
                  caption: "Family portrait",
                  uploadedBy: "Joon",
                  likeCount: 9,
                  likedByViewer: false,
                },
              ],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({ ok: true, status: 201 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                canVote: true,
                photoCount: 124,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [
                {
                  id: "photo-family",
                  caption: "Family portrait",
                  uploadedBy: "Joon",
                  likeCount: 10,
                  likedByViewer: true,
                },
              ],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const likeButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Like photo",
    );

    await act(async () => {
      likeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/prototype/photos/photo-family/likes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-demo",
        }),
      },
    );
    expect(container.textContent).toContain("Saved photo like.");
    expect(container.textContent).toContain("10 likes");
    expect(container.textContent).toContain("Liked by you");
  });

  it("opens the event page directly from an unvoted notification", async () => {
    window.history.replaceState({}, "", "/app");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "collecting",
                description: "Collect the best birthday photos.",
                votingStartsAt: "2026-04-01T09:00:00.000Z",
                votingEndsAt: "2026-04-14T09:00:00.000Z",
                canVote: true,
                canOwnerSelectPhotos: false,
                photoCount: 1,
              },
            ],
          },
          pendingInvitations: [],
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 0,
                uploadedCount: 1,
                helperText: "Loaded from backend",
              },
              photos: [
                {
                  id: "photo-family",
                  caption: "Family portrait",
                  uploadedBy: "Mina",
                  likeCount: 0,
                  likedByViewer: false,
                },
              ],
            },
          ],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const openEventButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Open event",
    );

    await act(async () => {
      openEventButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(window.location.pathname).toBe("/app/events");
    expect(container.textContent).toContain("Event page");
    expect(container.textContent).toContain("First birthday album");
    expect(container.textContent).toContain("Family portrait");
  });

  it("accepts an invitation from the account notifications and refreshes the workspace", async () => {
    window.history.replaceState({}, "", "/app");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [],
          },
          pendingInvitations: [
            {
              invitationId: "invite-kim",
              groupId: "group-kim",
              groupName: "Kim family moments",
              invitedUserId: "user-demo",
              invitedUserDisplayName: "SweetBook Demo User",
              invitedByDisplayName: "Sena",
            },
          ],
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 2, totalMembers: 3 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
              {
                id: "group-kim",
                name: "Kim family moments",
                memberCount: 1,
                role: "Contributor",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-kim",
                name: "Spring picnic highlights",
                groupName: "Kim family moments",
                status: "draft",
                description: "Collect the picnic moments before voting starts.",
                votingStartsAt: "2026-04-20T09:00:00.000Z",
                votingEndsAt: "2026-04-27T09:00:00.000Z",
                canVote: false,
                canOwnerSelectPhotos: false,
                photoCount: 0,
              },
            ],
          },
          pendingInvitations: [],
          groupMembers: [
            {
              groupId: "group-kim",
              userId: "user-demo",
              displayName: "SweetBook Demo User",
              role: "Contributor",
            },
          ],
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const acceptButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Accept invite",
    );

    await act(async () => {
      acceptButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/prototype/invitations/invite-kim/accept",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-demo",
        }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/prototype/workspace");
    expect(window.location.pathname).toBe("/app/groups");
    expect(container.textContent).toContain("Joined Kim family moments.");
    expect(container.textContent).toContain("Kim family moments");
    expect(container.textContent).toContain("Spring picnic highlights");
    expect(container.textContent).toContain("You joined this group from an invitation");
    expect(container.textContent).toContain("Start here");
    expect(container.textContent).toContain(
      "No active voting is open in this group yet. You can still review the event list below.",
    );
  });

  it("declines an invitation from the account notifications and refreshes the workspace", async () => {
    window.history.replaceState({}, "", "/app");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [],
          },
          pendingInvitations: [
            {
              invitationId: "invite-kim",
              groupId: "group-kim",
              groupName: "Kim family moments",
              invitedUserId: "user-demo",
              invitedUserDisplayName: "SweetBook Demo User",
              invitedByDisplayName: "Sena",
            },
          ],
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [],
          },
          pendingInvitations: [],
          photoWorkflows: [],
          candidateReviews: [],
          orderEntries: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const declineButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Decline",
    );

    await act(async () => {
      declineButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/prototype/invitations/invite-kim/decline",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "user-demo",
        }),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/prototype/workspace");
    expect(container.textContent).toContain("Declined invitation to Kim family moments.");
    expect(container.textContent).toContain("0 active");
  });

  it("lets the owner adjust the album selection and carries it into orders", async () => {
    window.history.replaceState({}, "", "/app/albums");
    window.localStorage.setItem("sweetbook.prototype.token", "ptok_saved");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: "ptok_saved",
          user: {
            userId: "user-demo",
            username: "demo",
            displayName: "SweetBook Demo User",
            role: "owner",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspace: {
            groupSummary: { totalGroups: 1, totalMembers: 2 },
            groups: [
              {
                id: "group-han",
                name: "Han family",
                memberCount: 2,
                role: "Owner",
                eventCount: 1,
              },
            ],
            events: [
              {
                id: "event-birthday",
                name: "First birthday album",
                groupName: "Han family",
                status: "ready",
                canVote: false,
                canOwnerSelectPhotos: true,
                photoCount: 124,
              },
            ],
          },
          photoWorkflows: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              uploadState: {
                pendingCount: 3,
                uploadedCount: 124,
                helperText: "Upload queue is local-only until backend adapters land.",
              },
              photos: [
                {
                  id: "photo-cake",
                  caption: "Cake table setup",
                  uploadedBy: "Mina",
                  likeCount: 12,
                  likedByViewer: true,
                },
                {
                  id: "photo-family",
                  caption: "Family portrait",
                  uploadedBy: "Joon",
                  likeCount: 9,
                  likedByViewer: false,
                },
                {
                  id: "photo-gift",
                  caption: "Gift opening moment",
                  uploadedBy: "Ara",
                  likeCount: 7,
                  likedByViewer: true,
                },
              ],
            },
          ],
          candidateReviews: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              candidates: [
                {
                  photoId: "photo-cake",
                  caption: "Cake table setup",
                  rank: 1,
                  likeCount: 12,
                  whySelected: "Selected because Cake table setup is leading with 12 likes.",
                },
                {
                  photoId: "photo-family",
                  caption: "Family portrait",
                  rank: 2,
                  likeCount: 9,
                  whySelected:
                    "Selected because Family portrait remains one of the strongest liked moments in this event.",
                },
                {
                  photoId: "photo-gift",
                  caption: "Gift opening moment",
                  rank: 3,
                  likeCount: 7,
                  whySelected:
                    "Selected because Gift opening moment has strong engagement and includes your like.",
                },
              ],
              pagePreview: [
                {
                  pageNumber: 1,
                  title: "Cover preview",
                  photoCaptions: ["Cake table setup"],
                },
              ],
            },
          ],
          orderEntries: [
            {
              activeEventId: "event-birthday",
              activeEventName: "First birthday album",
              selectedCandidateCount: 3,
              handoffSummary: {
                bookFormat: "Hardcover square",
                payloadSections: ["selected photos", "page preview", "event title"],
                note: "Review this summary before backend submission is wired.",
              },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const container = document.createElement("div");
    containers.push(container);
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(createElement(AppShell));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const removeButtons = Array.from(container.querySelectorAll("button")).filter(
      (button) => button.textContent === "Remove from book",
    );

    await act(async () => {
      removeButtons[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Updated owner album selection.");
    expect(container.textContent).toContain("2 owner-approved photos are queued for this book draft.");

    const ordersLink = Array.from(container.querySelectorAll("a")).find(
      (link) => link.textContent === "Order",
    );

    await act(async () => {
      ordersLink?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain("2 shortlisted photos ready");
    expect(container.textContent).toContain("Chosen cover: Family portrait");
    expect(container.textContent).toContain("Story spreads: Gift opening moment");
  });
});

function setInputValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setTextAreaValue(input: HTMLTextAreaElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  );
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files,
  });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
