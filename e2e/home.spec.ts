import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the hero section", async ({ page }) => {
    await page.goto("/");

    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /Transform Your Ideas into/i })
    ).toBeVisible();

    // Check for BuildPrompt AI branding
    await expect(page.getByText("BuildPrompt AI")).toBeVisible();
  });

  test("should display the build form", async ({ page }) => {
    await page.goto("/");

    // Check for form elements
    await expect(page.getByLabel(/Project Idea/i)).toBeVisible();
    await expect(page.getByLabel(/Coding Agent/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Generate Build Guide/i })
    ).toBeVisible();
  });

  test("should show validation error for empty idea", async ({ page }) => {
    await page.goto("/");

    // Try to submit empty form
    await page.getByRole("button", { name: /Generate Build Guide/i }).click();

    // Should show validation error
    await expect(
      page.getByText(/Please describe your project idea/i)
    ).toBeVisible();
  });

  test("should navigate to pricing page", async ({ page }) => {
    await page.goto("/");

    // Click pricing link
    await page.getByRole("link", { name: /Pricing/i }).click();

    // Should be on pricing page
    await expect(page).toHaveURL("/pricing");
    await expect(
      page.getByRole("heading", { name: /Simple, Transparent Pricing/i })
    ).toBeVisible();
  });

  test("should show sign in button for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/");

    // Check for sign in button
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("should display feature cards", async ({ page }) => {
    await page.goto("/");

    // Check for feature section
    await expect(
      page.getByRole("heading", { name: /Why BuildPrompt AI/i })
    ).toBeVisible();

    // Check for feature cards
    await expect(page.getByText(/Always Up-to-Date/i)).toBeVisible();
    await expect(page.getByText(/Security First/i)).toBeVisible();
    await expect(page.getByText(/Agent-Optimized/i)).toBeVisible();
  });

  test("should display supported agents section", async ({ page }) => {
    await page.goto("/");

    // Check for agents section
    await expect(
      page.getByText(/Works With Your Favorite Coding Agents/i)
    ).toBeVisible();

    // Check for some agent names
    await expect(page.getByText("Claude Projects")).toBeVisible();
    await expect(page.getByText("Cursor")).toBeVisible();
  });
});

test.describe("Pricing Page", () => {
  test("should display all pricing tiers", async ({ page }) => {
    await page.goto("/pricing");

    // Check for tier names
    await expect(page.getByText("Free", { exact: true })).toBeVisible();
    await expect(page.getByText("Pro", { exact: true })).toBeVisible();
    await expect(page.getByText("Enterprise", { exact: true })).toBeVisible();
  });

  test("should display pricing amounts", async ({ page }) => {
    await page.goto("/pricing");

    // Check for prices
    await expect(page.getByText("$0")).toBeVisible();
    await expect(page.getByText("$15")).toBeVisible();
    await expect(page.getByText("$50")).toBeVisible();
  });

  test("should display FAQ section", async ({ page }) => {
    await page.goto("/pricing");

    // Check for FAQ
    await expect(
      page.getByRole("heading", { name: /Frequently Asked Questions/i })
    ).toBeVisible();
    await expect(page.getByText(/What counts as a build/i)).toBeVisible();
  });
});

test.describe("Build Form Interaction", () => {
  test("should expand advanced options", async ({ page }) => {
    await page.goto("/");

    // Click advanced options toggle
    await page.getByText(/Advanced Options/i).click();

    // Should show additional fields
    await expect(page.getByLabel(/Preferred Tech Stack/i)).toBeVisible();
    await expect(page.getByLabel(/Additional Context/i)).toBeVisible();
  });

  test("should select different coding agents", async ({ page }) => {
    await page.goto("/");

    // Open select dropdown
    await page.getByLabel(/Coding Agent/i).click();

    // Select Cursor
    await page.getByText("Cursor").click();

    // Verify selection
    await expect(page.getByText("Cursor")).toBeVisible();
  });

  test("should show custom agent input when custom is selected", async ({
    page,
  }) => {
    await page.goto("/");

    // Open select dropdown
    await page.getByLabel(/Coding Agent/i).click();

    // Select Custom Agent
    await page.getByText("Custom Agent").click();

    // Should show custom agent input
    await expect(page.getByLabel(/Custom Agent Name/i)).toBeVisible();
  });
});
