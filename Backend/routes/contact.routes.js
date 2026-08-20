import { Router } from "express";
import * as contactController from "../controller/contactController.js";

const router = Router();
router.post("/", contactController.submitContact);

export const contactRouter = router;
