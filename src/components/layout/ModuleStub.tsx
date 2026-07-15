import { ReactNode } from "react";
import { PageBody } from "@/components/layout/PageShell";

export function ModuleStub({
  icon,
  title,
  description,
  bullets,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <PageBody>
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface border-hairline mx-auto flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <h2 className="text-xl font-medium mt-4 tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
        <ul className="mt-6 text-left inline-block space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-8">Coming next — reach out to prioritize.</p>
      </div>
    </PageBody>
  );
}
