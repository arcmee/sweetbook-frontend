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
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeSweetBookEstimate> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/sweetbook/estimate"), {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to run prototype SweetBook estimate: ${response.status}`);
  }

  return (await response.json()) as PrototypeSweetBookEstimate;
}

export async function requestPrototypeSweetBookSubmit(
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeSweetBookSubmitResult> {
  const response = await fetchImpl(resolveApiUrl("/api/prototype/sweetbook/submit"), {
    method: "POST",
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

export async function fetchPrototypeAuthSession(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeAuthSession> {
  const response = await fetchImpl(
    resolveApiUrl(`/api/prototype/auth/session?token=${encodeURIComponent(token)}`),
  );

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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
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
