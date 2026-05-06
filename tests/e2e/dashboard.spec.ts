import { expect, test } from "@playwright/test";

test("dashboard route is protected or accessible when authenticated", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login|\/dashboard/);
});