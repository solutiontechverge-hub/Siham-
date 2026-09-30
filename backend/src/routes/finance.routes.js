import express from "express";
import { body } from "express-validator";
import {
  bulkFinanceTransactionAction,
  createFinanceTransaction,
  createFinanceTransactionFromBooking,
  createStripeConnectOnboardingLink,
  getFinanceSettings,
  listSalesCardMetadata,
  upsertSalesCardMetadata,
  listSalesAddons,
  upsertSalesAddon,
  deleteSalesAddon,
  getPublicInvoiceSettings,
  getPublicTransactionOptions,
  listFinanceTransactions,
  processFinanceInvoiceReissues,
  replaceFinanceTransaction,
  reissueFinanceInvoiceForBooking,
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
  textBody,
  uuidParam,
  LIMITS,
} from "../validators/fields.js";

const router = express.Router();
const requireProfessional = authorizeRoles("professional");

router.use(authenticateUser);

router.get("/settings", requireProfessional, getFinanceSettings);
router.get("/sales-card-metadata", requireProfessional, listSalesCardMetadata);
router.put("/sales-card-metadata", requireProfessional, upsertSalesCardMetadata);
router.get("/sales-addons", requireProfessional, listSalesAddons);
router.put("/sales-addons", requireProfessional, upsertSalesAddon);
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
  ],
  validateRequest,
  updateFinanceStripeStatus,
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
    body("penaltyAmount").optional({ values: "falsy" }).isFloat({ min: 0 }),
    body("totalPrice").optional({ values: "falsy" }).isFloat({ min: 0 }),
    emailBody("clientEmail", { optional: true }),
    textBody("clientName", { optional: true, max: LIMITS.personName }),
    textBody("paymentMethod", { optional: true, max: 64 }),
  ],
  validateRequest,
  reissueFinanceInvoiceForBooking,
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

router.get("/transactions", requireProfessional, listFinanceTransactions);

router.post(
  "/transactions",
  requireProfessional,
  [
    textBody("clientName", { optional: true, max: LIMITS.personName }),
    emailBody("clientEmail", { optional: true }),
    textBody("clientType", { optional: true, max: 32 }),
    enumBody("paymentMethod", ["onlineDirect", "offlineDirect"], { optional: true }),
    body("totalPrice").isFloat({ min: 0 }).withMessage("totalPrice must be a non-negative number."),
    body("lines").optional().isArray({ max: 100 }).withMessage("lines must be an array."),
    body("lines.*.name")
      .optional()
      .isString()
      .isLength({ max: LIMITS.textShort })
      .withMessage("line name is too long."),
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
    body("totalPrice").isFloat({ min: 0 }).withMessage("totalPrice must be a non-negative number."),
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
  ],
  validateRequest,
  bulkFinanceTransactionAction,
);

export default router;
