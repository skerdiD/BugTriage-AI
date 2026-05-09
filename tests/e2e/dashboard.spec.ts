import { expect, test } from "@playwright/test";

test("@smoke home page renders primary product CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /turn messy bug reports into prioritized engineering tickets/i,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /start triaging/i }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /see how it works/i })
  ).toBeVisible();
});

for (const route of [
  "/dashboard",
  "/tickets",
  "/analytics",
  "/team",
  "/settings",
]) {
  test(`@smoke protected route ${route} redirects unauthenticated users to login`, async ({
    page,
  }) => {
    await page.goto(route);

    const encodedRoute = route.replace(/\//g, "%2F");
    await expect(
      page
    ).toHaveURL(new RegExp(`/login(?:\\?redirectedFrom=${encodedRoute})?$`));
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  });
}
