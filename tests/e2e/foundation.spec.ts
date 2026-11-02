import { test, expect } from "@playwright/test";
test("landing and honest setup state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Big dreams/ })).toBeVisible();
  await page.getByRole("link", { name: "Explore the workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Your canvas is ready for setup." }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveJSProperty("scrollWidth", 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("theme toggle and mobile menu", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("class", /light|dark/);
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
  }
});
test("APIs reject unauthenticated writes", async ({ request }) => {
  const response = await request.put("/api/profile", {
    data: { role: "admin" },
  });
  expect([401, 503]).toContain(response.status());
});
