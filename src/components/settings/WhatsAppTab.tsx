import { Link } from "react-router-dom";
import { Pill } from "@/components/layout/PageShell";
import { MessageCircle } from "lucide-react";

export default function WhatsAppTab() {
  return <div className="max-w-3xl space-y-4">
    <div className="rounded-lg border-hairline bg-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><MessageCircle className="h-5 w-5 text-primary" /></div>
      <div className="flex-1"><div className="text-sm font-medium">+44 7700 900 100 · Brightside Services</div><div className="text-xs text-muted-foreground">WhatsApp Business · Quality rating: High · Demo connection</div></div>
      <Pill tone="success">Connected</Pill>
    </div>
    <p className="text-sm text-muted-foreground">Templates, campaigns, replies and results live in the <Link to="/whatsapp?tab=templates" className="text-primary">WhatsApp</Link> section.</p>
  </div>;
}
