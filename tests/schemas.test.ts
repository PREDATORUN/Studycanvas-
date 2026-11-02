import { describe, it, expect } from "vitest";
import {
  profileSchema,
  taskSchema,
  taskUpdateSchema,
} from "../src/lib/schemas";
const profile = {
  displayName: "Souvik",
  exam: "JEE Main",
  grade: "11",
  targetYear: new Date().getFullYear() + 2,
  subjects: ["Physics", "Chemistry", "Mathematics"],
  goal: "Understand every chapter",
};
describe("untrusted input", () => {
  it("accepts a valid student profile", () =>
    expect(profileSchema.safeParse(profile).success).toBe(true));
  it("rejects role escalation", () =>
    expect(profileSchema.safeParse({ ...profile, role: "admin" }).success).toBe(
      false,
    ));
  it("rejects private contact fields", () =>
    expect(profileSchema.safeParse({ ...profile, phone: "123" }).success).toBe(
      false,
    ));
  it("rejects stale target years", () =>
    expect(
      profileSchema.safeParse({ ...profile, targetYear: 2020 }).success,
    ).toBe(false));
  it("rejects empty tasks", () =>
    expect(taskSchema.safeParse({ title: "   " }).success).toBe(false));
  it("limits task size", () =>
    expect(taskSchema.safeParse({ title: "x".repeat(161) }).success).toBe(
      false,
    ));
  it("blocks document path injection", () =>
    expect(
      taskUpdateSchema.safeParse({ id: "../other", completed: true }).success,
    ).toBe(false));
  it("requires a real boolean", () =>
    expect(
      taskUpdateSchema.safeParse({ id: "abc", completed: "false" }).success,
    ).toBe(false));
});
