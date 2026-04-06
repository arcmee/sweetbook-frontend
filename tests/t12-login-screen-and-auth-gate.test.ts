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
  });

  it("creates a group and refreshes the workspace snapshot", async () => {
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
                photoCount: 124,
              },
              {
                id: "event-created-2",
                name: "Graduation album",
                groupName: "Han family",
                status: "draft",
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
    const createButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Plan a new event",
    );

    await act(async () => {
      if (eventTitleInput) {
        setInputValue(eventTitleInput, "Graduation album");
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
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/prototype/workspace");
    expect(container.textContent).toContain("Graduation album");
    expect(container.textContent).toContain("Created event Graduation album.");
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
    const createPhotoButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Add event photos",
    );

    await act(async () => {
      if (photoCaptionInput) {
        setInputValue(photoCaptionInput, "Balloon arch");
      }
    });

    await act(async () => {
      createPhotoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/prototype/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: "event-birthday",
        caption: "Balloon arch",
      }),
    });
    expect(container.textContent).toContain("Added photo Balloon arch.");
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
