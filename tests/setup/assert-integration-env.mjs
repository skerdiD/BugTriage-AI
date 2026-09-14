function parseUrl(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for integration tests.`);

  try {
    return new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
}

function assertTestDatabase(name) {
  const url = parseUrl(name);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (!databaseName.includes("_test")) {
    throw new Error(
      `${name} must name a dedicated test database (expected "_test" in the database name).`
    );
  }
}

assertTestDatabase("DATABASE_URL");
assertTestDatabase("DIRECT_URL");

const redisUrl = parseUrl("REDIS_URL");
if (
  !["redis:", "rediss:"].includes(redisUrl.protocol) ||
  !["localhost", "127.0.0.1", "[::1]"].includes(redisUrl.hostname) ||
  redisUrl.pathname !== "/15"
) {
  throw new Error(
    "REDIS_URL must use isolated local Redis database 15 for integration tests."
  );
}

console.info("Integration test database and Redis targets passed safety checks.");
