import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Bug reports engineers can act on",
  description:
    "Turn rough bug reports, screenshots, and logs into clear tickets with impact, reproduction steps, and a practical place to start.",
};

export default function HomePage() {
  return <LandingPage />;
}
