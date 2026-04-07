import type { PrototypeWorkspaceSnapshot } from "../application/prototype-workspace-snapshot";
import type {
  PrototypeSweetBookEstimate,
  PrototypeSweetBookSubmitResult,
} from "../application/prototype-sweetbook-estimate";
import type { PrototypeAuthSession } from "../application/prototype-auth";

export async function fetchPrototypeWorkspaceSnapshot(
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeWorkspaceSnapshot> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/workspace"));

  if (!response.ok) {
    throw new Error(`Failed to load prototype workspace snapshot: ${response.status}`);
  }

  return (await response.json()) as PrototypeWorkspaceSnapshot;
}

export async function requestPrototypeSweetBookEstimate(
  input: {
    eventId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeSweetBookEstimate> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/sweetbook/estimate"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to run prototype SweetBook estimate: ${response.status}`);
  }

  return (await response.json()) as PrototypeSweetBookEstimate;
}

export async function requestPrototypeSweetBookSubmit(
  input: {
    eventId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeSweetBookSubmitResult> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/sweetbook/submit"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit prototype SweetBook order: ${response.status}`);
  }

  return (await response.json()) as PrototypeSweetBookSubmitResult;
}

export async function requestPrototypeAuthLogin(
  input: {
    username: string;
    password: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeAuthSession> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to sign in to prototype auth: ${response.status}`);
  }

  return (await response.json()) as PrototypeAuthSession;
}

export async function requestPrototypeAuthSignup(
  input: {
    displayName: string;
    username: string;
    password: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeAuthSession> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/auth/signup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to sign up for prototype auth: ${response.status}`);
  }

  return (await response.json()) as PrototypeAuthSession;
}

export async function fetchPrototypeAuthSession(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeAuthSession> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/auth/session"), {
    headers: buildPrototypeAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Failed to load prototype auth session: ${response.status}`);
  }

  return (await response.json()) as PrototypeAuthSession;
}

export async function requestPrototypeAuthLogout(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/auth/logout"), {
    method: "POST",
    headers: buildPrototypeAuthHeaders(token),
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to sign out of prototype auth: ${response.status}`);
  }
}

export async function requestPrototypeGroupCreate(
  input: {
    name: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/groups"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to create prototype group: ${response.status}`);
  }
}

export async function requestPrototypeEventCreate(
  input: {
    groupId: string;
    title: string;
    description: string;
    votingStartsAt: string;
    votingEndsAt: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/events"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to create prototype event: ${response.status}`);
  }
}

export async function requestPrototypePasswordChange(
  input: {
    currentPassword: string;
    nextPassword: string;
    token: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/account/password"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildPrototypeAuthHeaders(input.token),
    },
    body: JSON.stringify(input),
  });

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to change prototype password: ${response.status}`);
  }
}

export async function searchPrototypeUsers(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Array<{ userId: string; username: string; displayName: string }>> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/users/search?q=${encodeURIComponent(query)}`),
  );

  if (!response.ok) {
    throw new Error(`Failed to search prototype users: ${response.status}`);
  }

  return (await response.json()) as Array<{
    userId: string;
    username: string;
    displayName: string;
  }>;
}

export async function requestPrototypeGroupInvite(
  input: {
    groupId: string;
    userId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/groups/${encodeURIComponent(input.groupId)}/invitations`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: input.userId,
      }),
    },
  );

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to invite prototype member: ${response.status}`);
  }
}

export async function requestPrototypeInvitationAccept(
  input: {
    invitationId: string;
    userId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(
      `/api/prototype/invitations/${encodeURIComponent(input.invitationId)}/accept`,
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: input.userId,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to accept prototype invitation: ${response.status}`);
  }
}

export async function requestPrototypeInvitationDecline(
  input: {
    invitationId: string;
    userId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(
      `/api/prototype/invitations/${encodeURIComponent(input.invitationId)}/decline`,
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: input.userId,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to decline prototype invitation: ${response.status}`);
  }
}

export async function requestPrototypeOwnerTransfer(
  input: {
    groupId: string;
    nextOwnerUserId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/groups/${encodeURIComponent(input.groupId)}/owner`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nextOwnerUserId: input.nextOwnerUserId,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to transfer prototype owner: ${response.status}`);
  }
}

export async function requestPrototypeGroupLeave(
  input: {
    groupId: string;
    userId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/groups/${encodeURIComponent(input.groupId)}/leave`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: input.userId,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to leave prototype group: ${response.status}`);
  }
}

export async function requestPrototypeEventVotingClose(
  input: {
    eventId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/events/${encodeURIComponent(input.eventId)}/close-voting`),
    {
      method: "POST",
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to close prototype event voting: ${response.status}`);
  }
}

export async function requestPrototypeEventVotingExtend(
  input: {
    eventId: string;
    votingEndsAt: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/events/${encodeURIComponent(input.eventId)}/extend-voting`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        votingEndsAt: input.votingEndsAt,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to extend prototype event voting: ${response.status}`);
  }
}

export async function requestPrototypeEventOwnerApproval(
  input: {
    eventId: string;
    ownerApproved: boolean;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/events/${encodeURIComponent(input.eventId)}/owner-approval`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerApproved: input.ownerApproved,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to update prototype owner approval: ${response.status}`);
  }
}

export async function requestPrototypePagePlanSelection(
  input: {
    eventId: string;
    selectedPhotoIds: string[];
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/events/${encodeURIComponent(input.eventId)}/page-plan/selection`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedPhotoIds: input.selectedPhotoIds,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to update prototype page plan selection: ${response.status}`);
  }
}

export async function requestPrototypePagePlanCover(
  input: {
    eventId: string;
    coverPhotoId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/events/${encodeURIComponent(input.eventId)}/page-plan/cover`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coverPhotoId: input.coverPhotoId,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to update prototype page plan cover: ${response.status}`);
  }
}

export async function requestPrototypePagePlanLayout(
  input: {
    eventId: string;
    pageId: string;
    layout: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(
      `/api/prototype/events/${encodeURIComponent(input.eventId)}/page-plan/pages/${encodeURIComponent(input.pageId)}/layout`,
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        layout: input.layout,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to update prototype page layout: ${response.status}`);
  }
}

export async function requestPrototypePagePlanNote(
  input: {
    eventId: string;
    pageId: string;
    note: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(
      `/api/prototype/events/${encodeURIComponent(input.eventId)}/page-plan/pages/${encodeURIComponent(input.pageId)}/note`,
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        note: input.note,
      }),
    },
  );

  if (!response.ok && response.status !== 200) {
    throw new Error(`Failed to update prototype page note: ${response.status}`);
  }
}

export async function requestPrototypePhotoCreate(
  input: {
    eventId: string;
    caption: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/photos"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to create prototype photo: ${response.status}`);
  }
}

export async function requestPrototypePhotoUpload(
  input: {
    eventId: string;
    caption: string;
    file: File;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const formData = new FormData();
  formData.set("eventId", input.eventId);
  formData.set("caption", input.caption);
  formData.set("file", input.file);

  const response = await fetchImpl(resolveApiUrl("/api/prototype/photo-uploads"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to upload prototype photo: ${response.status}`);
  }
}

export async function requestPrototypePhotoLike(
  input: {
    photoId: string;
    userId: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/photos/${encodeURIComponent(input.photoId)}/likes`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: input.userId,
      }),
    },
  );

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to like prototype photo: ${response.status}`);
  }
}

function resolveApiUrl(path: string): string {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function buildPrototypeAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}
