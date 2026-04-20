import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="px-8 h-16 border-b-hairline flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-[22px] font-medium tracking-tight leading-none">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-auto px-8 py-6">{children}</div>;
}

export function Btn({
  variant = "secondary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-background border-hairline text-foreground hover:bg-surface-hover",
    ghost: "text-foreground hover:bg-surface-hover",
  };
  return (
    <button
      {...props}
      className={`h-8 px-3 rounded-md text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${styles[variant]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function StatusDot({ color }: { color: string }) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />;
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-surface text-muted-foreground",
    success: "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
    danger: "bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]",
    info: "bg-primary/10 text-primary",
  };
  return (
    <span className={`inline-flex items-center gap-1 h-5 px-1.5 rounded text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
