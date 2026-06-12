export function parsePrepaymentPercent(label?: string | null): number {
  if (!label) return 0;
  const normalized = label.trim().toLowerCase();
  if (!normalized || normalized === "none" || normalized === "no" || normalized === "0%") return 0;
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}
