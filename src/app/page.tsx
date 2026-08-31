import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "AI bug triage for engineering teams",
  description:
    "Turn rough bug reports, screenshots, and logs into structured, engineering-ready tickets with AI analysis, similar-issue search, analytics, and GitHub export.",
  openGraph: {
    title: "BugTriage AI — From rough report to engineering-ready ticket",
    description:
      "AI-assisted bug triage with structured analysis, duplicate discovery, team workflows, and GitHub export.",
    images: ["/engineering-dashboard.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BugTriage AI — AI bug triage for engineering teams",
    description:
      "Turn messy bug reports into structured, reviewable engineering tickets.",
    images: ["/engineering-dashboard.png"],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
