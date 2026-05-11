import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "BugTriage AI | Turn Messy Bug Reports Into Engineering-Ready Tickets",
  description:
    "BugTriage AI transforms screenshots, logs, and unclear bug reports into structured engineering tickets with AI-assisted triage, secure uploads, and a real team dashboard.",
};

export default function HomePage() {
  return <LandingPage />;
}
