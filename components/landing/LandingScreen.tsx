"use client";

import { Hero } from "./Hero";
import { PillarShowcase } from "./PillarShowcase";
import { HowItWorks } from "./HowItWorks";
import { ReportPreview } from "./ReportPreview";
import { CredibilityStrip } from "./CredibilityStrip";
import { CTABand } from "./CTABand";

export function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto w-full max-w-landing px-6">
      <Hero onStart={onStart} />
      <PillarShowcase />
      <HowItWorks />
      <ReportPreview />
      <CredibilityStrip />
      <CTABand onStart={onStart} />
    </div>
  );
}
