import { roundBookingMoney } from "../../../data/bookingLinePricing";

export function formatFinanceEuro(amount: number): string {
  const rounded = roundBookingMoney(amount);
  const abs = Math.abs(rounded).toFixed(2);
  return rounded < 0 ? `-€${abs}` : `€${abs}`;
}

/** Compact € label — drops trailing `.00` (sales/checkout cards). */
export function formatCompactEuro(amount: number): string {
  const rounded = roundBookingMoney(amount);
  const abs = Math.abs(rounded);
  const text = Number.isInteger(abs) ? String(abs) : abs.toFixed(2);
  return `${rounded < 0 ? "-" : ""}€${text}`;
}

/** Day-only ISO → `dd/mm/yyyy`; empty input → empty string. */
export function formatFinanceDueDate(iso?: string | null): string {
  if (!iso) return "";
  const dayOnly = iso.length <= 10 ? `${iso}T00:00:00` : iso;
  const d = new Date(dayOnly);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB");
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

export function prepaidBreakdownLabel(percent: number, paid = false): string {
  const word = paid ? "Prepaid" : "Prepayment";
  const label = formatFinancePercent(percent);
  return label ? `${word} (${label}%)` : word;
}

/** Remaining row label — uses prepaid % when known, else amount/total. */
export function remainingBreakdownLabel(
  prepaidPercent: number,
  remainingAmount?: number,
  totalPrice?: number,
): string {
  let remainingPercent = 0;
  if (prepaidPercent > 0) {
    remainingPercent = Math.max(0, 100 - prepaidPercent);
  } else if (
    totalPrice != null &&
    totalPrice > 0 &&
    remainingAmount != null &&
    Number.isFinite(remainingAmount)
  ) {
    remainingPercent =
      Math.round(
        ((remainingAmount / totalPrice) * 100 + Number.EPSILON) * 100,
      ) / 100;
  }
  const label = formatFinancePercent(remainingPercent);
  return label ? `Remaining (${label}%)` : "Remaining";
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
