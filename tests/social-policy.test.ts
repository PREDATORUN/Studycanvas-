import { describe, it, expect } from "vitest";
import {
  canJoin,
  canPublish,
  isMember,
  type SpacePolicy,
} from "../src/features/social/policy";
const base: SpacePolicy = {
  ownerId: "alice",
  memberIds: ["alice", "bob"],
  private: false,
  closed: false,
  kind: "community",
};
describe("space authorization", () => {
  it("keeps nonmembers out of messages", () =>
    expect(isMember(base, "eve")).toBe(false));
  it("allows joining an open public group", () =>
    expect(canJoin(base, "eve")).toBe(true));
  it("requires invitations for private groups", () =>
    expect(canJoin({ ...base, private: true }, "eve")).toBe(false));
  it("requires invitations for teacher classes", () =>
    expect(canJoin({ ...base, kind: "class" }, "eve")).toBe(false));
  it("refuses duplicate memberships", () =>
    expect(canJoin(base, "bob")).toBe(false));
  it("refuses entry after closing", () =>
    expect(canJoin({ ...base, closed: true }, "eve")).toBe(false));
  it("limits membership to 100", () =>
    expect(
      canJoin(
        {
          ...base,
          memberIds: Array.from({ length: 100 }, (_, i) => String(i)),
        },
        "eve",
      ),
    ).toBe(false));
  it("allows a member to publish", () =>
    expect(canPublish(base, "bob", false)).toBe(true));
  it("restricts announcements to owners", () => {
    expect(canPublish(base, "bob", true)).toBe(false);
    expect(canPublish(base, "alice", true)).toBe(true);
  });
  it("rejects posting in closed spaces", () =>
    expect(canPublish({ ...base, closed: true }, "alice", true)).toBe(false));
});
