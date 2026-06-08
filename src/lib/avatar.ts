export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PALETTE = [
  { bg: "bg-[hsl(var(--primary)/0.12)]", fg: "text-primary" },
  { bg: "bg-[hsl(var(--success)/0.15)]", fg: "text-[hsl(var(--success))]" },
  { bg: "bg-[hsl(var(--warning)/0.15)]", fg: "text-[hsl(var(--warning))]" },
  { bg: "bg-[hsl(var(--info)/0.15)]", fg: "text-[hsl(var(--info))]" },
  { bg: "bg-[hsl(var(--destructive)/0.12)]", fg: "text-[hsl(var(--destructive))]" },
  { bg: "bg-surface", fg: "text-foreground" },
];

export function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
