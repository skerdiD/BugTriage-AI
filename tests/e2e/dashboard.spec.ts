import { expect, test } from "@playwright/test";

test("@smoke home page renders primary product CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /turn rough bug reports into tickets engineers can act on/i,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /explore the demo/i }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /see an example/i }).first()
  ).toBeVisible();
});

for (const route of ["/login", "/signup"]) {
  test(`@smoke authentication page ${route} opens without auth fetch errors`, async ({
    page,
  }) => {
    const authFetchErrors: string[] = [];

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes("AuthRetryableFetchError")
      ) {
        authFetchErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      if (error.message.includes("AuthRetryableFetchError")) {
        authFetchErrors.push(error.message);
      }
    });

    await page.goto(route);

    await expect(page.getByLabel("Email address")).toBeVisible();
    expect(authFetchErrors).toEqual([]);
  });
}

for (const route of [
  "/dashboard",
  "/tickets",
  "/analytics",
  "/team",
  "/profile",
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
