import express from "express";
import { body } from "express-validator";
import {
  bulkFinanceTransactionAction,
  createFinanceTransaction,
  createFinanceTransactionFromBooking,
  createStripeConnectOnboardingLink,
  getFinanceSettings,
  getPublicInvoiceSettings,
  getPublicTransactionOptions,
  listFinanceTransactions,
  processFinanceInvoiceReissues,
  replaceFinanceTransaction,
  updateFinanceInvoiceSettings,
  updateFinanceStripeStatus,
  updateFinanceTransaction,
  updateFinanceTransactionOptions,
} from "../controllers/finance.controller.js";
import { authenticateUser, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";

const router = express.Router();
const requireProfessional = authorizeRoles("professional");

router.use(authenticateUser);

router.get("/settings", requireProfessional, getFinanceSettings);

router.put(
  "/settings/invoice",
  requireProfessional,
  body("invoiceSettings").optional().isObject(),
  validateRequest,
  updateFinanceInvoiceSettings,
);

router.put(
  "/settings/transaction-options",
  requireProfessional,
  validateRequest,
  updateFinanceTransactionOptions,
);

router.put(
  "/settings/stripe",
  requireProfessional,
  body("action").optional().isString(),
  validateRequest,
  updateFinanceStripeStatus,
);

router.post(
  "/settings/stripe/connect-link",
  requireProfessional,
  validateRequest,
  createStripeConnectOnboardingLink,
);

router.post("/invoices/process-reissues", requireProfessional, processFinanceInvoiceReissues);

router.get("/transaction-options/:businessSetupId", getPublicTransactionOptions);
router.get("/invoice-settings/:businessSetupId", getPublicInvoiceSettings);

router.get("/transactions", requireProfessional, listFinanceTransactions);

router.post(
  "/transactions",
  requireProfessional,
  body("clientName").optional().isString(),
  body("clientEmail").optional().isString(),
  body("clientType").optional().isString(),
  body("paymentMethod").optional().isIn(["onlineDirect", "offlineDirect"]),
  body("totalPrice").isFloat({ min: 0 }),
  body("lines").optional().isArray(),
  validateRequest,
  createFinanceTransaction,
);

router.post(
  "/transactions/from-booking",
  body("bookingId").optional({ values: "falsy" }).isUUID(),
  body("bookingRef").optional({ values: "falsy" }).isString(),
  validateRequest,
  createFinanceTransactionFromBooking,
);

router.post(
  "/transactions/:id/replace",
  requireProfessional,
  body("totalPrice").isFloat({ min: 0 }),
  validateRequest,
  replaceFinanceTransaction,
);

router.patch(
  "/transactions/:id",
  requireProfessional,
  body("status").optional().isString(),
  body("note").optional().isString(),
  validateRequest,
  updateFinanceTransaction,
);

router.post(
  "/transactions/bulk",
  requireProfessional,
  body("ids").isArray({ min: 1 }),
  body("action").isIn(["refund", "void", "cancel", "delete"]),
  validateRequest,
  bulkFinanceTransactionAction,
);

export default router;
