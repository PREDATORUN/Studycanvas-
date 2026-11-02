import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: { uid: "eve", email_verified: true, auth_time: Date.now() / 1000 },
  space: {
    ownerId: "alice",
    memberIds: ["alice", "bob"],
    private: false,
    closed: false,
    kind: "community",
  },
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/lib/server", async (original) => {
  const actual = await original<typeof import("../src/lib/server")>();
  return {
    ...actual,
    authorize: async () => mocks.user,
    mutation: async () => mocks.user,
  };
});
vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: vi.fn(),
  database: () => ({
    doc: (path: string) => ({
      path,
      get: async () => ({ data: () => ({ displayName: "Student" }) }),
    }),
    runTransaction: async (fn: (arg: unknown) => unknown) =>
      fn({
        get: async (ref: { path: string }) => ({
          exists: !ref.path.includes("invitations"),
          data: () => mocks.space,
        }),
        set: mocks.set,
        update: mocks.update,
      }),
  }),
}));
import { POST } from "../src/app/api/social/route";
import { GET as adminGet, POST as adminPost } from "../src/app/api/admin/route";
const req = (payload: unknown) =>
  new Request("https://study.test/api/social", {
    method: "POST",
    body: JSON.stringify(payload),
  });
beforeEach(() => {
  mocks.space = {
    ownerId: "alice",
    memberIds: ["alice", "bob"],
    private: false,
    closed: false,
    kind: "community",
  };
  mocks.set.mockReset();
  mocks.update.mockReset();
});
it("denies admin report reads to students", async () => {
  expect(
    (await adminGet(new Request("https://study.test/api/admin"))).status,
  ).toBe(403);
});
it("denies administrative writes to students", async () => {
  expect(
    (await adminPost(req({ action: "approveTeacher", id: "eve" }))).status,
  ).toBe(403);
});
it("denies class creation without trusted teacher claims", async () => {
  expect(
    (
      await POST(
        req({
          action: "space",
          title: "Class test",
          description: "Physics class",
          kind: "class",
          private: true,
        }),
      )
    ).status,
  ).toBe(403);
});
it("denies posts from nonmembers", async () => {
  expect(
    (
      await POST(
        req({
          action: "post",
          id: "space",
          text: "Hello",
          announcement: false,
        }),
      )
    ).status,
  ).toBe(403);
  expect(mocks.set).not.toHaveBeenCalled();
});
it("rejects injected ownership fields", async () => {
  expect(
    (
      await POST(
        req({
          action: "post",
          id: "space",
          text: "Hello",
          announcement: false,
          ownerId: "eve",
        }),
      )
    ).status,
  ).toBe(400);
});
it("denies private joins without an invitation", async () => {
  mocks.space.private = true;
  expect((await POST(req({ action: "join", id: "space" }))).status).toBe(403);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("allows a public join but derives the UID from authentication", async () => {
  expect((await POST(req({ action: "join", id: "space" }))).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledTimes(1);
});
it("denies member announcements unless owner", async () => {
  mocks.space.memberIds.push("eve");
  expect(
    (
      await POST(
        req({
          action: "post",
          id: "space",
          text: "Announcement",
          announcement: true,
        }),
      )
    ).status,
  ).toBe(403);
});
