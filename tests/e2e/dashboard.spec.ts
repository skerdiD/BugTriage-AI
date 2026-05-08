import { expect, test } from "@playwright/test";

test("@smoke home page renders primary product CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /turn messy bug reports into clean engineering tickets/i,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open dashboard/i })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /submit demo bug/i })
  ).toBeVisible();
});

test("@smoke protected dashboard routes redirect unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login(?:\?redirectedFrom=%2Fdashboard)?$/);
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
});
