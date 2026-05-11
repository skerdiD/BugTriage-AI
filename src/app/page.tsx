import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "BugTriage AI | Turn Messy Bug Reports Into Engineering-Ready Tickets",
  description:
    "BugTriage AI helps teams turn screenshots, logs, and vague bug reports into structured engineering-ready tickets with AI triage and protected full-stack workflow.",
};

export default function HomePage() {
  return <LandingPage />;
}
