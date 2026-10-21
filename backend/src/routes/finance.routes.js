import express from "express";
import { body } from "express-validator";
import {
  bulkFinanceTransactionAction,
  createFinanceTransaction,
  createFinanceTransactionFromBooking,
  createStripeConnectOnboardingLink,
  createStripeDashboardLink,
  getStripeConnectStatus,
  getFinanceSettings,
  listSalesCardMetadata,
  upsertSalesCardMetadata,
  listSalesAddons,
  upsertSalesAddon,
  deleteSalesAddon,
  getBookingFinancials,
  getPublicInvoiceSettings,
  getPublicTransactionOptions,
  listFinanceTransactions,
  getFinanceAnalytics,
  processFinanceInvoiceReissues,
  replaceFinanceTransaction,
  reissueFinanceInvoiceForBooking,
  restartPrepaymentDue,
  updateFinanceInvoiceSettings,
  updateFinanceStripeStatus,
  updateFinanceTransaction,
  updateFinanceTransactionOptions,
} from "../controllers/finance.controller.js";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  emailBody,
  enumBody,
  numericBody,
  textBody,
  uuidParam,
  LIMITS,
} from "../validators/fields.js";

const router = express.Router();
const requireProfessional = authorizeRoles("professional");

router.use(authenticateUser);

router.get("/settings", requireProfessional, getFinanceSettings);
router.get("/sales-card-metadata", requireProfessional, listSalesCardMetadata);
router.put(
  "/sales-card-metadata",
  requireProfessional,
  [numericBody("totalPrice", { optional: true, min: 0 })],
  validateRequest,
  upsertSalesCardMetadata,
);
router.get("/sales-addons", requireProfessional, listSalesAddons);
router.get("/bookings/:bookingId/financials", requireProfessional, getBookingFinancials);
router.put(
  "/sales-addons",
  requireProfessional,
  [
    numericBody("discountAmount", { optional: true, min: 0 }),
    numericBody("discount.amount", { optional: true, min: 0 }),
    numericBody("totalPrice", { min: 0 }),
    numericBody("lines.*.quantity", { min: 0 }),
    numericBody("lines.*.unitPrice", { min: 0 }),
  ],
  validateRequest,
  upsertSalesAddon,
);
router.delete("/sales-addons/:id", requireProfessional, deleteSalesAddon);

router.put(
  "/settings/invoice",
  requireProfessional,
  [body("invoiceSettings").optional().isObject().withMessage("invoiceSettings must be an object.")],
  validateRequest,
  updateFinanceInvoiceSettings,
);

router.put(
  "/settings/transaction-options",
  requireProfessional,
  [body().isObject().withMessage("transaction options must be an object.")],
  validateRequest,
  updateFinanceTransactionOptions,
);

router.put(
  "/settings/stripe",
  requireProfessional,
  [
    textBody("action", { optional: true, max: 64, label: "action" }),
    textBody("subscriptionStatus", { optional: true, max: 64 }),
    textBody("stripeConnectStatus", { optional: true, max: 64 }),
    body("autoPay").optional().isBoolean().withMessage("autoPay must be a boolean."),
  ],
  validateRequest,
  updateFinanceStripeStatus,
);

router.get(
  "/settings/stripe/status",
  requireProfessional,
  validateRequest,
  getStripeConnectStatus,
);

router.post(
  "/settings/stripe/connect-link",
  requireProfessional,
  [
    textBody("accountId", { optional: true, max: 128 }),
    textBody("refreshUrl", { optional: true, max: 2048 }),
    textBody("returnUrl", { optional: true, max: 2048 }),
  ],
  validateRequest,
  createStripeConnectOnboardingLink,
);

router.post(
  "/settings/stripe/dashboard-link",
  requireProfessional,
  validateRequest,
  createStripeDashboardLink,
);

router.post(
  "/invoices/process-reissues",
  requireProfessional,
  validateRequest,
  processFinanceInvoiceReissues,
);

router.post(
  "/invoices/reissue",
  requireProfessional,
  [
    body("bookingId").optional({ values: "falsy" }).isUUID(),
    textBody("bookingRef", { optional: true, max: 120 }),
    textBody("dueDate", { min: 1, max: 32, label: "dueDate" }),
    numericBody("penaltyAmount", { optional: true, min: 0 }),
    numericBody("totalPrice", { optional: true, min: 0 }),
    emailBody("clientEmail", { optional: true }),
    textBody("clientName", { optional: true, max: LIMITS.personName }),
    textBody("paymentMethod", { optional: true, max: 64 }),
  ],
  validateRequest,
  reissueFinanceInvoiceForBooking,
);

router.post(
  "/prepayment-due/restart",
  requireProfessional,
  [
    body("bookingId").optional({ values: "falsy" }).isUUID(),
    textBody("bookingRef", { optional: true, max: 120 }),
  ],
  validateRequest,
  restartPrepaymentDue,
);

router.get(
  "/transaction-options/:businessSetupId",
  [uuidParam("businessSetupId")],
  validateRequest,
  getPublicTransactionOptions,
);
router.get(
  "/invoice-settings/:businessSetupId",
  [uuidParam("businessSetupId")],
  validateRequest,
  getPublicInvoiceSettings,
);

router.get("/analytics", requireProfessional, getFinanceAnalytics);
// Controller allows clients only when bookingId scopes to their own booking.
router.get("/transactions", listFinanceTransactions);

router.post(
  "/transactions",
  requireProfessional,
  [
    textBody("clientName", { optional: true, max: LIMITS.personName }),
    emailBody("clientEmail", { optional: true }),
    textBody("clientType", { optional: true, max: 32 }),
    enumBody(
      "paymentMethod",
      [
        "onlineDirect",
        "offlineDirect",
        "onlineNonDirect",
        "offlineNonDirect",
        "onlineInvoice",
        "offlineInvoice",
      ],
      { optional: true },
    ),
    numericBody("totalPrice", { min: 0 }),
    numericBody("discountAmount", { optional: true, min: 0 }),
    body("lines").optional().isArray({ max: 100 }).withMessage("lines must be an array."),
    body("lines.*.name")
      .optional()
      .isString()
      .isLength({ max: LIMITS.textShort })
      .withMessage("line name is too long."),
    numericBody("lines.*.quantity", { min: 0 }),
    numericBody("lines.*.unitPrice", { min: 0 }),
  ],
  validateRequest,
  createFinanceTransaction,
);

router.post(
  "/transactions/from-booking",
  [
    body("bookingId").optional({ values: "falsy" }).isUUID(),
    textBody("bookingRef", { optional: true, max: 120 }),
    textBody("paymentPhase", { optional: true, max: 32 }),
    textBody("paymentMethod", { optional: true, max: 64 }),
    textBody("status", { optional: true, max: 64 }),
  ],
  validateRequest,
  createFinanceTransactionFromBooking,
);

router.post(
  "/transactions/:id/replace",
  requireProfessional,
  [
    uuidParam("id"),
    numericBody("totalPrice", { min: 0 }),
  ],
  validateRequest,
  replaceFinanceTransaction,
);

router.patch(
  "/transactions/:id",
  requireProfessional,
  [
    uuidParam("id"),
    textBody("status", { optional: true, max: 64 }),
    textBody("note", { optional: true, min: LIMITS.notesMin, max: null }),
  ],
  validateRequest,
  updateFinanceTransaction,
);

router.post(
  "/transactions/bulk",
  requireProfessional,
  [
    body("ids").isArray({ min: 1, max: 200 }).withMessage("ids must be a non-empty array."),
    body("ids.*").isUUID().withMessage("each id must be a UUID."),
    enumBody("action", ["refund", "void", "cancel", "delete"]),
    textBody("refundMethod", { optional: true, max: 64 }),
    textBody("reason", { optional: true, max: 500 }),
    body("refundMode")
      .optional({ nullable: true })
      .isIn(["item", "amount"])
      .withMessage("refundMode must be item or amount."),
    body("refundItems").optional({ nullable: true }).isArray({ max: 200 }),
    body("bankDetails").optional({ nullable: true }).isObject(),
    textBody("bankDetails.accountHolder", { optional: true, max: 200 }),
    textBody("bankDetails.iban", { optional: true, max: 64 }),
  ],
  validateRequest,
  bulkFinanceTransactionAction,
);

export default router;
