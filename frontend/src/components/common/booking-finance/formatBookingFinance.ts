export function formatFinanceEuro(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const abs = Math.abs(rounded).toFixed(2);
  return rounded < 0 ? `-€${abs}` : `€${abs}`;
}

export function formatFinancePercent(percent: number): string {
  const rounded = Math.round((percent + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(rounded) || rounded <= 0) return "";
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatFinanceDate(iso?: string | null): string {
  if (!iso) return new Date().toLocaleDateString("en-GB");
  const dayOnly = iso.length <= 10 ? `${iso}T00:00:00` : iso;
  const d = new Date(dayOnly);
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString("en-GB");
  return d.toLocaleDateString("en-GB");
}

export function formatFinanceTime(value?: string | null): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    return `${Number(ampmMatch[1])}:${ampmMatch[2]} ${ampmMatch[3].toUpperCase()}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [hoursRaw, minutes] = raw.split(":");
    const hours = Number(hoursRaw);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hours12}:${minutes} ${ampm}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatFinanceDateTime(
  iso?: string | null,
  time?: string | null,
): string {
  const datePart = formatFinanceDate(iso);
  const timePart = formatFinanceTime(time);
  if (!timePart) {
    if (iso && iso.length > 10) {
      const fromIso = formatFinanceTime(iso);
      return fromIso ? `${datePart} ${fromIso}` : datePart;
    }
    return datePart;
  }
  return `${datePart} ${timePart}`;
}

export function formatFinanceMethodLabel(method?: string | null): string {
  const value = String(method ?? "").toLowerCase();
  if (value === "offline" || value === "offlinedirect") return "Offline Direct";
  if (value === "onlinenondirect" || value === "onlineinvoice") {
    return "Online Invoice";
  }
  if (value === "offlinenondirect" || value === "offlineinvoice") {
    return "Offline Invoice";
  }
  return "Online Direct";
}

export function prepaidBreakdownLabel(percent: number): string {
  const label = formatFinancePercent(percent);
  return label ? `Prepayment (${label}%)` : "Prepayment";
}

export function formatOfflinePrepaymentVisitNote(
  shopName?: string | null,
  bookingDateTime?: string | null,
): string {
  const shop = String(shopName ?? "").trim() || "the professional";
  const when = String(bookingDateTime ?? "").trim();
  if (when) {
    return `You have to pay this amount when you visit ${shop} at ${when}.`;
  }
  return `You have to pay this amount when you visit ${shop}.`;
}

export const OFFLINE_PREPAYMENT_VISIT_NOTE = formatOfflinePrepaymentVisitNote();
