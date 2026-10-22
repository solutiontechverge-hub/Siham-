import {
  getTransactionActionCategory,
  type TransactionRow,
} from "../data/transactions";
import type { ActionMenuItem } from "./overview.types";

export const INITIAL_VISIBLE = 10;

/** Guest/model payer lines — sync sometimes stores clientType as mollure. */
export function isFinanceGuestOrModelRow(row: TransactionRow): boolean {
  if (row.clientType === "guest") return true;
  const name = row.clientName.trim();
  if (/^guest\b/i.test(name) || /^model\b/i.test(name)) return true;
  const label = row.entryLabel ?? "";
  return /\bGuest\b/i.test(label) || /\bModel\b/i.test(label);
}

function phaseSortKey(label: string | undefined): number {
  const t = (label ?? "").toLowerCase();
  if (t.includes("prepayment")) return 1;
  if (t.includes("after treatment") && t.includes("main")) return 2;
  if (t.includes("late cancellation")) return 3;
  if (t.includes("late reschedul")) return 4;
  if (t.includes("no-show") || t.includes("noshow")) return 5;
  if (t.includes("after treatment")) return 6;
  if (t.includes("add-on")) return 7;
  return 8;
}

function guestDisplayName(row: TransactionRow): string {
  const fromLabel = row.entryLabel?.match(
    /(?:Guest|Model)\s*·\s*(.+)$/i,
  )?.[1]?.trim();
  if (fromLabel) return fromLabel;
  return row.clientName.replace(/^(Guest|Model)\s*·\s*/i, "").trim() || row.clientName;
}

/** Prefer AT / fee summary doc over PRE when collapsing main phases into one row. */
function pickMainSummaryRow(mains: TransactionRow[]): TransactionRow {
  return (
    mains.find((r) => {
      const t = (r.entryLabel ?? "").toLowerCase();
      return t.includes("after treatment") && t.includes("main");
    }) ||
    mains.find((r) => /late cancellation|late reschedul|no-show/i.test(r.entryLabel ?? "")) ||
    mains.find((r) => r.document?.documentNumber || r.issuedDocument?.documentNumber) ||
    mains[0]!
  );
}

/**
 * Overview display (per booking) — dynamic from API rows:
 * - Main client: ONE row (PRE/AT/fees collapse; invoice/status summary updates)
 * - Each guest/model: ONE continuation row (their services + price + invoice)
 * Dedupes sync clone add-ons for the same guest name.
 */
export function groupFinanceOverviewRows(
  rows: readonly TransactionRow[],
): TransactionRow[] {
  const groups = new Map<string, TransactionRow[]>();
  const order: string[] = [];
  for (const row of rows) {
    const key = String(row.entryId || row.bookingId || row.id);
    const list = groups.get(key);
    if (!list) {
      groups.set(key, [row]);
      order.push(key);
    } else {
      list.push(row);
    }
  }

  const out: TransactionRow[] = [];
  for (const key of order) {
    const siblings = groups.get(key)!;
    const withFin = siblings.find((r) => r.bookingFinancials);
    const mains = siblings
      .filter((r) => !isFinanceGuestOrModelRow(r))
      .sort(
        (a, b) =>
          phaseSortKey(a.entryLabel) - phaseSortKey(b.entryLabel) ||
          String(a.date ?? "").localeCompare(String(b.date ?? "")),
      );
    const guests = siblings.filter((r) => isFinanceGuestOrModelRow(r));

    const identity =
      mains.find((r) => r.clientName.trim()) ??
      siblings.find((r) => !isFinanceGuestOrModelRow(r));
    const mainName =
      identity?.clientName?.trim() ||
      siblings.find((r) => r.bookerName?.trim())?.bookerName?.trim() ||
      "";
    const mainEmail =
      identity?.clientEmail?.trim() ||
      siblings.find((r) => r.bookerEmail?.trim())?.bookerEmail?.trim() ||
      "";
    const sharedEntryId = siblings.find((r) => r.entryId)?.entryId ?? key;

    let first = true;

    if (mains.length) {
      const seed = pickMainSummaryRow(mains);
      const netTotal = withFin?.bookingFinancials?.net_total;
      out.push({
        ...seed,
        entryId: sharedEntryId,
        // One summary row — no PRE/AT/LCF phase label under Entry ID.
        entryLabel: undefined,
        clientName: mainName || seed.clientName,
        clientEmail: mainEmail || seed.clientEmail,
        bookingFinancials: withFin?.bookingFinancials ?? seed.bookingFinancials,
        bookingStatus: withFin?.bookingStatus ?? seed.bookingStatus,
        netAmount:
          typeof netTotal === "number" && Number.isFinite(netTotal)
            ? netTotal
            : mains.reduce((s, r) => s + (Number(r.netAmount) || 0), 0),
        guestNames: undefined,
      });
      first = false;
    }

    // Prefer real guest AT row over duplicate Add-ons clones (same person).
    const guestBest = new Map<string, TransactionRow>();
    const guestRank = (r: TransactionRow) => {
      if (r.clientType === "guest") return 0;
      if (/after treatment/i.test(r.entryLabel ?? "")) return 1;
      if (/add-on/i.test(r.entryLabel ?? "")) return 3;
      return 2;
    };
    for (const g of guests) {
      const nameKey = guestDisplayName(g).toLowerCase();
      if (!nameKey) continue;
      const prev = guestBest.get(nameKey);
      if (!prev || guestRank(g) < guestRank(prev)) guestBest.set(nameKey, g);
    }

    for (const g of guestBest.values()) {
      const display = guestDisplayName(g);
      out.push({
        ...g,
        entryId: first ? sharedEntryId : null,
        entryLabel: undefined,
        clientName: display,
        clientType: "guest",
        clientEmail: g.clientEmail || mainEmail,
        bookingFinancials: withFin?.bookingFinancials ?? g.bookingFinancials,
        bookingStatus: withFin?.bookingStatus ?? g.bookingStatus,
        guestNames: undefined,
      });
      first = false;
    }

    if (!mains.length && guestBest.size === 0 && siblings[0]) {
      out.push(siblings[0]);
    }
  }
  return out;
}

export const ADD_MENU_ITEMS = [
  { id: "newSale", label: "New Sales" },
  { id: "addNote", label: "Note" },
] as const;

export const ACTION_EXPORT_ITEMS = [
  { id: "exportTable", label: "Export item/table" },
  { id: "exportInvoiceReceipt", label: "Export invoices/receipts" },
] as const;

export function buildActionMenuItems(
  category: ReturnType<typeof getTransactionActionCategory>,
  canMarkUnpaid = false,
  canMarkPaid = false,
): ActionMenuItem[] {
  const exportItem: ActionMenuItem = {
    id: "export",
    label: "Export",
    hasSubmenu: true,
  };

  switch (category) {
    case "paid":
      return [
        { id: "refund", label: "Refund", requiresSelection: true },
        ...(canMarkUnpaid
          ? [{ id: "markUnpaid", label: "Mark Unpaid", requiresSelection: true as const }]
          : []),
        { id: "voidSales", label: "Void Sales", requiresSelection: true },
        exportItem,
      ];
    case "failed":
      return [
        { id: "deleteSales", label: "Delete Sales", requiresSelection: true },
        { id: "editSales", label: "Edit Sales", requiresSelection: true },
        exportItem,
      ];
    case "pending":
      return [
        { id: "cancelSales", label: "Cancel Sales", requiresSelection: true },
        ...(canMarkUnpaid
          ? [{ id: "markUnpaid", label: "Mark Unpaid", requiresSelection: true as const }]
          : []),
        { id: "editSales", label: "Edit Sales", requiresSelection: true },
        exportItem,
      ];
    case "voided":
      return [
        { id: "deleteSales", label: "Delete Sales", requiresSelection: true },
        exportItem,
      ];
    case "due":
      // Overdue / unpaid — no refund until payment is received
      return [
        ...(canMarkUnpaid ? [{ id: "markUnpaid", label: "Mark Unpaid", requiresSelection: true as const }] : []),
        ...(canMarkPaid ? [{ id: "markPaid", label: "Mark Paid", requiresSelection: true as const }] : []),
        { id: "voidSales", label: "Void Sales", requiresSelection: true },
        exportItem,
      ];
    case "mixed":
      return [exportItem];
    default:
      // No selection yet — show common actions (disabled until a row is selected)
      return [
        { id: "refund", label: "Refund", requiresSelection: true },
        { id: "voidSales", label: "Void Sales", requiresSelection: true },
        exportItem,
      ];
  }
}
