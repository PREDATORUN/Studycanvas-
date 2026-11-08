import { test, expect } from "@playwright/test";

// Real-browser acceptance suite. These checks must run before visual acceptance;
// the unit tests intentionally do not substitute for compositor verification.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("studycanvas:glass-quality", "clear");
    localStorage.setItem("theme", "light");
  });
});

test("live backdrop refraction, moving lens, bounded resources, and idle rendering", async ({
  page,
}, info) => {
  await page.goto("/appearance");
  const lens = page.locator(".optics-lens");
  await expect(lens).toHaveAttribute("data-refracting", "true");
  const before = await lens.screenshot();
  // Turn off only displacement, preserving tint, highlights, geometry and the backdrop.
  await lens.evaluate((el) =>
    (el as HTMLElement).style.setProperty("--lg-filter", "blur(0px)"),
  );
  const neutral = await lens.screenshot();
  expect(
    before.equals(neutral),
    "SVG displacement must change painted pixels",
  ).toBe(false);
  await lens.evaluate((el) =>
    (el as HTMLElement).style.removeProperty("--lg-filter"),
  );
  // Trigger a resize, causing the shared renderer to reinstall the filter.
  await page.getByLabel("Surface appearance").selectOption("simple");
  await page.getByLabel("Surface appearance").selectOption("clear");
  await expect(lens).toHaveAttribute("data-refracting", "true");
  const initial = await lens.boundingBox();
  await page.getByRole("slider", { name: "Lens position" }).focus();
  await page.getByRole("slider", { name: "Lens position" }).press("End");
  const moved = await lens.boundingBox();
  expect(moved!.x).toBeGreaterThan(initial!.x);
  expect(moved!.x + moved!.width).toBeLessThanOrEqual(
    await page.evaluate(() => innerWidth),
  );
  const changed = await lens.screenshot();
  expect(before.equals(changed)).toBe(false);
  await expect(page.locator("html")).toHaveAttribute(
    "data-glass-animating",
    "false",
  );
  const maps = await page.locator("html").getAttribute("data-glass-maps");
  await page.waitForTimeout(200);
  expect(await page.locator("html").getAttribute("data-glass-maps")).toBe(maps);
  expect(await page.locator("filter").count()).toBeLessThanOrEqual(16);
  await page.screenshot({
    path: info.outputPath("appearance-light.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await page.screenshot({
    path: info.outputPath("appearance-dark.png"),
    fullPage: true,
  });
});

test("tap ripple leaves labels still and the preferences dialog supports Escape", async ({
  page,
}) => {
  await page.goto("/appearance");
  const button = page.getByRole("button", { name: "Hide reference grid" });
  await expect(button).toBeVisible();
  const bounds = await button.boundingBox();
  await button.dispatchEvent("pointerdown", {
    clientX: bounds!.x + 20,
    clientY: bounds!.y + 20,
    pointerType: "touch",
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-glass-animating",
    "true",
  );
  expect(await button.evaluate((el) => getComputedStyle(el).transform)).toBe(
    "none",
  );
  await button.dispatchEvent("pointerup");
  await expect(page.locator("html")).toHaveAttribute(
    "data-glass-animating",
    "false",
  );
  await page.getByRole("button", { name: "Appearance settings" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("all device sizes retain navigation, readable fallback and reduced motion", async ({
  page,
}) => {
  await page.goto("/learning");
  await expect(
    page.getByRole("heading", { name: "Build understanding." }),
  ).toBeVisible();
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("link", { name: "Practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Think it through." }),
  ).toBeVisible();
  await expect(page.locator(".question-card")).toBeVisible();
  const radio = page.getByRole("radio").first();
  await radio.check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Appearance settings" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Surface appearance")
    .selectOption("solid");
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute(
    "data-glass-quality",
    "solid",
  );
  await expect(page.locator("filter")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-glass-animating",
    "false",
  );
});

test("fixed navigation samples scrolling content", async ({ page }) => {
  await page.goto("/learning");
  const header = page.locator(".topbar");
  await expect(header).toHaveAttribute("data-refracting", "true");
  const before = await header.boundingBox();
  const first = await header.screenshot();
  await page.evaluate(() => window.scrollTo(0, 350));
  const after = await header.boundingBox();
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(2);
  expect(first.equals(await header.screenshot())).toBe(false);
});
