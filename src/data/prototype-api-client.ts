import type { PrototypeWorkspaceSnapshot } from "../application/prototype-workspace-snapshot";

export async function fetchPrototypeWorkspaceSnapshot(
  fetchImpl: typeof fetch = fetch,
): Promise<PrototypeWorkspaceSnapshot> {
  const response = await fetchImpl("/api/prototype/workspace");

  if (!response.ok) {
    throw new Error(`Failed to load prototype workspace snapshot: ${response.status}`);
  }

  return (await response.json()) as PrototypeWorkspaceSnapshot;
}
