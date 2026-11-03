import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  configured: vi.fn(),
  verify: vi.fn(),
  doc: vi.fn(),
  transaction: vi.fn(),
  authDelete: vi.fn(),
}));
vi.mock("@/lib/firebase/admin", () => ({
  adminConfigured: mocks.configured,
  adminAuth: () => ({
    verifyIdToken: mocks.verify,
    deleteUser: mocks.authDelete,
  }),
  database: () => ({ doc: mocks.doc, runTransaction: mocks.transaction }),
}));
import { authorize, mutation } from "../src/lib/server";
import { PUT, GET } from "../src/app/api/profile/route";
function request(method = "PUT", body: unknown = {}) {
  return new Request("https://study.test/api/profile", {
    method,
    headers: {
      Authorization: "Bearer token",
      "Content-Type": "application/json",
      Origin: "https://study.test",
    },
    ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.configured.mockReturnValue(true);
  mocks.verify.mockResolvedValue({ uid: "alice", email_verified: true });
  mocks.doc.mockReturnValue({ path: "users/alice" });
  mocks.transaction.mockImplementation(async (fn) =>
    fn({ get: async () => ({ data: () => undefined }), set: vi.fn() }),
  );
});
describe("server trust boundaries", () => {
  it("rejects missing tokens", async () => {
    await expect(
      authorize(new Request("https://study.test/api/profile")),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("checks token revocation", async () => {
    await authorize(request());
    expect(mocks.verify).toHaveBeenCalledWith("token", true);
  });
  it("rejects revoked or invalid tokens", async () => {
    mocks.verify.mockRejectedValue(new Error("revoked"));
    expect((await GET(request("GET"))).status).toBe(401);
  });
  it("rejects unverified writes", async () => {
    mocks.verify.mockResolvedValue({ uid: "alice", email_verified: false });
    await expect(mutation(request())).rejects.toMatchObject({ status: 403 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects cross-origin writes", async () => {
    const req = new Request("https://study.test/api/profile", {
      method: "PUT",
      headers: { Origin: "https://evil.test" },
    });
    await expect(mutation(req)).rejects.toMatchObject({ status: 403 });
  });
  it("rejects client role escalation", async () => {
    const response = await PUT(
      request("PUT", {
        displayName: "Alice",
        exam: "NEET",
        grade: "11",
        targetYear: new Date().getFullYear() + 2,
        subjects: ["Biology"],
        goal: "Study biology",
        role: "admin",
      }),
    );
    expect(response.status).toBe(400);
  });
  it("assigns the student role only from server defaults", async () => {
    const writes: unknown[] = [];
    mocks.transaction.mockImplementation(async (fn) =>
      fn({
        get: async () => ({ exists: false, data: () => undefined }),
        set: (...args: unknown[]) => writes.push(args),
      }),
    );
    expect(
      (
        await PUT(
          request("PUT", {
            displayName: "Alice",
            exam: "NEET",
            grade: "11",
            targetYear: new Date().getFullYear() + 2,
            subjects: ["Biology"],
            goal: "Study biology",
          }),
        )
      ).status,
    ).toBe(200);
    expect(writes).toContainEqual([
      expect.anything(),
      expect.objectContaining({ role: "student" }),
      { merge: true },
    ]);
    expect(mocks.doc).toHaveBeenCalledWith("users/alice");
  });
  it("enforces the shared write budget", async () => {
    mocks.transaction.mockImplementation(async (fn) =>
      fn({
        get: async () => ({ data: () => ({ start: Date.now(), count: 30 }) }),
        set: vi.fn(),
      }),
    );
    await expect(mutation(request())).rejects.toMatchObject({ status: 429 });
  });
  it("returns an honest setup failure without credentials", async () => {
    mocks.configured.mockReturnValue(false);
    expect((await GET(request("GET"))).status).toBe(503);
  });
});
