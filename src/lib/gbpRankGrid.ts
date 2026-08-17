// Mock local rank-grid data: deterministic pseudo-ranks per keyword and grid point.

export type GridSize = 3 | 5 | 7;

export interface GridPoint {
  row: number;
  col: number;
  /** 1-20, or null when not found in the top 20 */
  rank: number | null;
  /** rank in the previous check, for trend arrows */
  previous: number | null;
}

export interface KeywordGrid {
  keyword: string;
  points: GridPoint[];
  averageRank: number | null;
  topThreeShare: number;
  foundShare: number;
  previousAverage: number | null;
}

export const defaultKeywords = [
  "builder near me",
  "kitchen fitter leeds",
  "bathroom renovation",
  "extension builder",
];

export const gridSizes: GridSize[] = [3, 5, 7];
export const radiusOptions = [1, 2, 5, 10];

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rankAt(keyword: string, row: number, col: number, size: GridSize, radius: number, offset = 0) {
  const centre = (size - 1) / 2;
  const distance = Math.sqrt((row - centre) ** 2 + (col - centre) ** 2);
  const base = 1 + (hash(`${keyword}|${offset}`) % 4);
  const spread = distance * (1.6 + radius * 0.35);
  const noise = (hash(`${keyword}|${row}|${col}|${offset}`) % 500) / 100; // 0-5
  const rank = Math.round(base + spread + noise);
  return rank > 20 ? null : rank;
}

export function buildKeywordGrid(keyword: string, size: GridSize, radius: number): KeywordGrid {
  const points: GridPoint[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      points.push({
        row,
        col,
        rank: rankAt(keyword, row, col, size, radius, 0),
        previous: rankAt(keyword, row, col, size, radius, 7),
      });
    }
  }
  const found = points.filter((p) => p.rank !== null);
  const prevFound = points.filter((p) => p.previous !== null);
  return {
    keyword,
    points,
    averageRank: found.length
      ? Number((found.reduce((a, p) => a + (p.rank as number), 0) / found.length).toFixed(1))
      : null,
    previousAverage: prevFound.length
      ? Number((prevFound.reduce((a, p) => a + (p.previous as number), 0) / prevFound.length).toFixed(1))
      : null,
    topThreeShare: Math.round(
      (points.filter((p) => p.rank !== null && (p.rank as number) <= 3).length / points.length) * 100,
    ),
    foundShare: Math.round((found.length / points.length) * 100),
  };
}

export function rankTone(rank: number | null) {
  if (rank === null) return "notfound" as const;
  if (rank <= 3) return "great" as const;
  if (rank <= 10) return "ok" as const;
  return "poor" as const;
}

export const rankToneClass: Record<ReturnType<typeof rankTone>, string> = {
  great: "bg-[hsl(var(--success)/0.16)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.35)]",
  ok: "bg-[hsl(var(--warning)/0.16)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.35)]",
  poor: "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]",
  notfound: "bg-surface text-muted-foreground border-transparent",
};

export function plainAdvice(grid: KeywordGrid) {
  if (grid.topThreeShare >= 70) return "You are in the top 3 across most of your area — keep posting and collecting reviews.";
  if (grid.foundShare < 50)
    return "You drop out of the results in a lot of spots. Add these words to your services and description, and ask nearby customers for reviews.";
  return "You rank well close to home but fade further out. Reviews mentioning nearby towns help the most here.";
}
