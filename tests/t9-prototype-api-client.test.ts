import { describe, expect, it, vi } from "vitest";

import {
  fetchPrototypeAuthSession,
  fetchPrototypeWorkspaceSnapshot,
  requestPrototypeEventCreate,
  requestPrototypeAuthLogin,
  requestPrototypeAuthLogout,
  requestPrototypeAuthSignup,
  requestPrototypeInvitationAccept,
  requestPrototypeInvitationDecline,
  requestPrototypePagePlanCover,
  requestPrototypePagePlanLayout,
  requestPrototypePagePlanNote,
  requestPrototypePagePlanSelection,
  requestPrototypePasswordChange,
  requestPrototypeGroupCreate,
  requestPrototypePhotoCreate,
  requestPrototypePhotoUpload,
  requestPrototypePhotoLike,
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

  it("posts prototype signup credentials and returns the auth session", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        token: "jwt.header.signature",
        user: {
          userId: "user-tester",
          username: "tester",
          displayName: "Tester",
          role: "member",
        },
      }),
    });

    const session = await requestPrototypeAuthSignup(
      {
        displayName: "Tester",
        username: "tester",
        password: "password123",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Tester",
        username: "tester",
        password: "password123",
      }),
    });
    expect(session.user.username).toBe("tester");
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

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/auth/session", {
      headers: {
        Authorization: "Bearer ptok_123",
      },
    });
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
        Authorization: "Bearer ptok_123",
      },
    });
  });

  it("posts a password change request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    await requestPrototypePasswordChange(
      {
        token: "ptok_123",
        currentPassword: "sweetbook123!",
        nextPassword: "sweetbook456!",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/account/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer ptok_123",
      },
      body: JSON.stringify({
        token: "ptok_123",
        currentPassword: "sweetbook123!",
        nextPassword: "sweetbook456!",
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
        description: "Collect the best second birthday moments.",
        votingStartsAt: "2026-04-10T09:00:00.000Z",
        votingEndsAt: "2026-04-17T09:00:00.000Z",
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
        description: "Collect the best second birthday moments.",
        votingStartsAt: "2026-04-10T09:00:00.000Z",
        votingEndsAt: "2026-04-17T09:00:00.000Z",
      }),
    });
  });

  it("posts a photo creation request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });

    await requestPrototypePhotoCreate(
      {
        eventId: "event-birthday",
        caption: "Cake table setup",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/photos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: "event-birthday",
        caption: "Cake table setup",
      }),
    });
  });

  it("posts invitation accept and decline requests", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    await requestPrototypeInvitationAccept(
      {
        invitationId: "invite-kim",
        userId: "user-demo",
      },
      fetchImpl as typeof fetch,
    );
    await requestPrototypeInvitationDecline(
      {
        invitationId: "invite-kim",
        userId: "user-demo",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
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
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
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
  });

  it("posts a photo like request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });

    await requestPrototypePhotoLike(
      {
        photoId: "photo-cake",
        userId: "user-demo",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith("/api/prototype/photos/photo-cake/likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "user-demo",
      }),
    });
  });

  it("posts page planner selection, cover, layout, and note requests", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    await requestPrototypePagePlanSelection(
      {
        eventId: "event-birthday",
        selectedPhotoIds: ["photo-cake", "photo-family"],
      },
      fetchImpl as typeof fetch,
    );
    await requestPrototypePagePlanCover(
      {
        eventId: "event-birthday",
        coverPhotoId: "photo-family",
      },
      fetchImpl as typeof fetch,
    );
    await requestPrototypePagePlanLayout(
      {
        eventId: "event-birthday",
        pageId: "spread-1",
        layout: "Collage spread",
      },
      fetchImpl as typeof fetch,
    );
    await requestPrototypePagePlanNote(
      {
        eventId: "event-birthday",
        pageId: "spread-1",
        note: "Use the candid moments here.",
      },
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "/api/prototype/events/event-birthday/page-plan/selection",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedPhotoIds: ["photo-cake", "photo-family"],
        }),
      },
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "/api/prototype/events/event-birthday/page-plan/cover",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coverPhotoId: "photo-family",
        }),
      },
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      "/api/prototype/events/event-birthday/page-plan/pages/spread-1/layout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layout: "Collage spread",
        }),
      },
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      4,
      "/api/prototype/events/event-birthday/page-plan/pages/spread-1/note",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: "Use the candid moments here.",
        }),
      },
    );
  });

  it("posts a multipart photo upload request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
    });
    const file = new File(["demo-image"], "balloon-arch.jpg", {
      type: "image/jpeg",
    });

    await requestPrototypePhotoUpload(
      {
        eventId: "event-birthday",
        caption: "Balloon arch",
        file,
      },
      fetchImpl as typeof fetch,
    );

    const [url, options] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/prototype/photo-uploads");
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect((options.body as FormData).get("eventId")).toBe("event-birthday");
    expect((options.body as FormData).get("caption")).toBe("Balloon arch");
    expect((options.body as FormData).get("file")).toBe(file);
  });
});
