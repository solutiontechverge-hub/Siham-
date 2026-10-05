import {
  getTransactionActionCategory,
} from "../data/transactions";
import type { ActionMenuItem } from "./overview.types";

export const INITIAL_VISIBLE = 10;

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
        { id: "markPaid", label: "Mark Paid", requiresSelection: true },
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
