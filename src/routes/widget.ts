import { Router } from "express";
import { widgetController } from "../controllers/widgetController.js";

const router = Router();

router.get("/", widgetController);

export { router as widgetRoute };
