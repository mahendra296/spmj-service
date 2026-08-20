import { Router } from "express";
import * as donationController from "../controller/donationController.js";

const publicRouter = Router();
publicRouter.get("/config", donationController.getDonationConfig);
publicRouter.post("/order", donationController.createOrder);
publicRouter.post("/verify", donationController.verifyPayment);
// Server-to-server webhook — no auth, authenticated by HMAC signature instead.
publicRouter.post("/webhook", donationController.handleWebhook);
publicRouter.get("/receipt/:ref", donationController.getDonationReceipt);
export const donationPublicRouter = publicRouter;

const adminRouter = Router();
adminRouter.get("/", donationController.listDonationsAdmin);
adminRouter.get("/export.csv", donationController.exportDonationsCsv);
export const donationAdminRouter = adminRouter;
