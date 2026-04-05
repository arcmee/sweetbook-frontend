import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

describe("frontend bootstrap baseline", () => {
  it("keeps the expected presentation and app folders in place", () => {
    const root = resolve(process.cwd());

    expect(existsSync(resolve(root, "src", "presentation"))).toBe(true);
    expect(existsSync(resolve(root, "src", "application"))).toBe(true);
    expect(existsSync(resolve(root, "src", "domain"))).toBe(true);
    expect(existsSync(resolve(root, "src", "data"))).toBe(true);
  });

  it("exports a root app entrypoint module", async () => {
    const module = await import("../src/presentation/app");

    expect(module).toHaveProperty("buildAppShell");
  });

  it("exports a root app shell component", async () => {
    const module = await import("../src/presentation/app-shell");

    expect(module).toHaveProperty("AppShell");
  });
});
