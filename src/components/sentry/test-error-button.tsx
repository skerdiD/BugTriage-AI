"use client";

export function TestErrorButton() {
  return (
    <button
      type="button"
      onClick={() => {
        throw new Error("Sentry test client error");
      }}
      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
    >
      Trigger client error
    </button>
  );
}
