import type { PrototypeWorkspaceSnapshot } from "../application/prototype-workspace-snapshot";
import type {
  PrototypeSweetBookEstimate,
  PrototypeSweetBookSubmitResult,
} from "../application/prototype-sweetbook-estimate";

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

function resolveApiUrl(path: string): string {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}
