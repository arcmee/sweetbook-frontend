import { describe, expect, it, vi } from "vitest";

import { fetchPrototypeWorkspaceSnapshot } from "../src/data/prototype-api-client";

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
});
