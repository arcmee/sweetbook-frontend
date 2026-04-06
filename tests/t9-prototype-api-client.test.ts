import { describe, expect, it, vi } from "vitest";

import {
  fetchPrototypeAuthSession,
  fetchPrototypeWorkspaceSnapshot,
  requestPrototypeEventCreate,
  requestPrototypeAuthLogin,
  requestPrototypeAuthLogout,
  requestPrototypeGroupCreate,
} from "../src/data/prototype-api-client";

describe("prototype api client", () => {
  it("fetches the prototype workspace snapshot from the backend contract", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
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
          ],
          events: [],
        },
        photoWorkflows: [],
        candidateReviews: [],
        orderEntries: [],
      }),
    });

    const snapshot = await fetchPrototypeWorkspaceSnapshot(fetchImpl as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/workspace");
    expect(snapshot.workspace.groups[0]?.name).toBe("Han family");
  });

  it("throws when the backend contract cannot be loaded", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(
      fetchPrototypeWorkspaceSnapshot(fetchImpl as typeof fetch),
    ).rejects.toThrow("Failed to load prototype workspace snapshot: 503");
  });

  it("posts prototype login credentials and returns the auth session", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "ptok_123",
        user: {
          userId: "user-demo",
          username: "demo",
          displayName: "SweetBook Demo User",
          role: "owner",
        },
      }),
    });

    const session = await requestPrototypeAuthLogin(
      {
        username: "demo",
        password: "sweetbook123!",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "demo",
        password: "sweetbook123!",
      }),
    });
    expect(session.user.displayName).toBe("SweetBook Demo User");
  });

  it("loads an auth session for a saved token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: "ptok_123",
        user: {
          userId: "user-demo",
          username: "demo",
          displayName: "SweetBook Demo User",
          role: "owner",
        },
      }),
    });

    const session = await fetchPrototypeAuthSession(
      "ptok_123",
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/prototype/auth/session?token=ptok_123",
    );
    expect(session.token).toBe("ptok_123");
  });

  it("posts a logout request for the saved token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    await requestPrototypeAuthLogout("ptok_123", fetchImpl as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: "ptok_123",
      }),
    });
  });

  it("posts a group creation request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });

    await requestPrototypeGroupCreate(
      {
        name: "New family group",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New family group",
      }),
    });
  });

  it("posts an event creation request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });

    await requestPrototypeEventCreate(
      {
        groupId: "group-han",
        title: "Second birthday album",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupId: "group-han",
        title: "Second birthday album",
      }),
    });
  });
});
