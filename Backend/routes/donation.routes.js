import { Router } from "express";
import * as donationController from "../controller/donationController.js";
import { requireAdmin } from "../middlewares/verify-auth-middleware.js";

const publicRouter = Router();
publicRouter.get("/api/donations/config", donationController.getDonationConfig);
publicRouter.post("/api/donations/order", donationController.createOrder);
publicRouter.post("/api/donations/verify", donationController.verifyPayment);
// Server-to-server webhook — no auth, authenticated by HMAC signature instead.
publicRouter.post("/api/donations/webhook", donationController.handleWebhook);
publicRouter.get("/api/donations/receipt/:ref", donationController.getDonationReceipt);
export const donationPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/api/admin/donations", requireAdmin, donationController.listDonationsAdmin);
adminRouter.get(
  "/api/admin/donations/export.csv",
  requireAdmin,
  donationController.exportDonationsCsv
);
export const donationAdminRouter = adminRouter;
