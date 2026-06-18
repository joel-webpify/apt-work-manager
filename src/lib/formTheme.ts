export interface BuilderTheme {
  accent: string;       // hex e.g. "#0f172a"
  background: string;   // hex
  text: string;         // hex
  fontFamily: "sans" | "serif" | "mono";
  buttonShape: "rounded" | "square" | "pill";
  /** Header visual treatment */
  headerStyle: "plain" | "banner" | "gradient" | "underline";
  headerAlign: "left" | "center";
  headerSize: "sm" | "md" | "lg";
  /** Optional emoji/icon shown above the title */
  headerEmoji?: string;
}

export const defaultTheme: BuilderTheme = {
  accent: "#0f172a",
  background: "#ffffff",
  text: "#0f172a",
  fontFamily: "sans",
  buttonShape: "rounded",
  headerStyle: "plain",
  headerAlign: "left",
  headerSize: "md",
  headerEmoji: "",
};

export const themePresets: { name: string; theme: BuilderTheme }[] = [
  { name: "Slate", theme: { ...defaultTheme } },
  { name: "Ocean", theme: { ...defaultTheme, accent: "#0369a1", text: "#0c2340" } },
  { name: "Emerald", theme: { ...defaultTheme, accent: "#047857", text: "#064e3b" } },
  { name: "Sunset", theme: { ...defaultTheme, accent: "#ea580c", text: "#7c2d12" } },
  { name: "Rose", theme: { ...defaultTheme, accent: "#e11d48", text: "#4c0519" } },
  { name: "Midnight", theme: { ...defaultTheme, accent: "#a78bfa", background: "#0b1020", text: "#e2e8f0" } },
];

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

export const hexToHslString = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

export const contrastForeground = (hex: string) => (luminance(hex) > 0.5 ? "0 0% 10%" : "0 0% 100%");

export const fontStack = (f: BuilderTheme["fontFamily"]) =>
  f === "serif"
    ? "'Instrument Serif', Georgia, 'Times New Roman', serif"
    : f === "mono"
      ? "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
      : "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

export const themeWrapperStyle = (t: BuilderTheme): React.CSSProperties => {
  const accentHsl = hexToHslString(t.accent);
  const fgHsl = contrastForeground(t.accent);
  return {
    ["--primary" as never]: accentHsl,
    ["--primary-foreground" as never]: fgHsl,
    ["--ring" as never]: accentHsl,
    backgroundColor: t.background,
    color: t.text,
    fontFamily: fontStack(t.fontFamily),
  } as React.CSSProperties;
};

export const buttonShapeClass = (shape: BuilderTheme["buttonShape"]) =>
  shape === "pill"
    ? "[&_button]:rounded-full"
    : shape === "square"
      ? "[&_button]:rounded-none"
      : "";
