import { Share2 } from "lucide-react";
import { ModuleStub } from "@/components/layout/ModuleStub";

export default function SocialOrganic() {
  return (
    <ModuleStub
      icon={<Share2 className="w-5 h-5" strokeWidth={1.75} />}
      title="Social — Organic"
      description="Plan, compose and schedule content across your social accounts."
      bullets={[
        "Connected accounts (Facebook, Instagram, LinkedIn, TikTok)",
        "Multi-account post composer with previews",
        "Content calendar (month & week view)",
        "Drafts, scheduled and published tabs with engagement",
      ]}
    />
  );
}
