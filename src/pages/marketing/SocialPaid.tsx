import { Target } from "lucide-react";
import { ModuleStub } from "@/components/layout/ModuleStub";

export default function SocialPaid() {
  return (
    <ModuleStub
      icon={<Target className="w-5 h-5" strokeWidth={1.75} />}
      title="Social — Paid"
      description="Run and optimize paid campaigns on Meta and LinkedIn."
      bullets={[
        "Campaign list with spend, CPC, CTR, conversions",
        "Creative library with A/B variants",
        "Audience presets and lookalike builder",
        "Cross-platform pacing and budget alerts",
      ]}
    />
  );
}
