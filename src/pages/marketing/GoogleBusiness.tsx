import { Store } from "lucide-react";
import { ModuleStub } from "@/components/layout/ModuleStub";

export default function GoogleBusiness() {
  return (
    <ModuleStub
      icon={<Store className="w-5 h-5" strokeWidth={1.75} />}
      title="Google Business Profile"
      description="Manage your local presence, reviews, posts and insights."
      bullets={[
        "Profile completeness and verification status",
        "Recent reviews with AI-drafted replies",
        "Post scheduler for offers, events and updates",
        "Insights: calls, direction requests, searches",
      ]}
    />
  );
}
