import { expect, test } from "@playwright/test";

test("@smoke home page renders primary product CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /bug reports arrive half-finished\. that's fine/i,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /open the sample/i }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /follow one report/i }).first()
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

test("@smoke authentication page switching keeps the invite destination", async ({
  page,
}) => {
  const invitePath = "/invite/invite_token_1234567890";

  await page.goto(`/login?redirectedFrom=${encodeURIComponent(invitePath)}`);
  await page.getByRole("link", { name: /set up an account/i }).click();

  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/signup" &&
      url.searchParams.get("redirectedFrom") === invitePath
    );
  });

  await page.getByRole("link", { name: /^sign in$/i }).click();

  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/login" &&
      url.searchParams.get("redirectedFrom") === invitePath
    );
  });
});

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

test("@smoke protected route login redirect preserves query state", async ({
  page,
}) => {
  await page.goto("/tickets?status=NEW&severity=HIGH");

  const url = new URL(page.url());
  expect(url.pathname).toBe("/login");
  expect(url.searchParams.get("redirectedFrom")).toBe(
    "/tickets?status=NEW&severity=HIGH"
  );
});
