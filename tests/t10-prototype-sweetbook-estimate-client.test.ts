import { describe, expect, it, vi } from "vitest";

import { requestPrototypeSweetBookEstimate } from "../src/data/prototype-api-client";

describe("prototype SweetBook estimate client", () => {
  it("posts to the backend estimate endpoint and parses the response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "blocked_insufficient_credit",
        bookUid: "bk_123",
        uploadedPhotoFileName: "photo-1.jpg",
        pageCount: 24,
        contentInsertions: [],
        estimate: {
          totalAmount: 3100,
          paidCreditAmount: 3410,
          creditBalance: 2590,
          creditSufficient: false,
          currency: "KRW",
        },
      }),
    });

    const result = await requestPrototypeSweetBookEstimate(
      fetchImpl as typeof fetch,
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/prototype/sweetbook/estimate",
      {
        method: "POST",
      },
    );
    expect(result.status).toBe("blocked_insufficient_credit");
    expect(result.estimate.paidCreditAmount).toBe(3410);
  });

  it("throws when the backend estimate endpoint fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(
      requestPrototypeSweetBookEstimate(fetchImpl as typeof fetch),
    ).rejects.toThrow("Failed to run prototype SweetBook estimate: 503");
  });
});
