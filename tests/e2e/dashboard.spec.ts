import { expect, test } from "@playwright/test";

test("@smoke home page renders primary product CTAs", async ({ page }) => {
  await page.goto("/");

  const main = page.getByRole("main");
  const primaryHeading = main.getByRole("heading", { level: 1 });

  await expect(primaryHeading).toBeVisible();
  await expect(primaryHeading).toContainText(
    /turn messy bug reports into engineering-ready tickets/i
  );
  await expect(
    main.getByRole("link", { name: /open live demo/i }).first()
  ).toBeVisible();
  await expect(
    main.getByRole("link", { name: /see how it works/i }).first()
  ).toBeVisible();
  await expect(
    main.getByRole("img", {
      name: /bugtriage ai engineering dashboard with ticket health/i,
    })
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
  await page.getByRole("link", { name: /create an account/i }).click();

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
