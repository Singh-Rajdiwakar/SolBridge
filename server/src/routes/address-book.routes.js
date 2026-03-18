import { Router } from "express";

import {
  create,
  destroy,
  list,
  update,
} from "../controllers/address-book.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

router.use(authenticate);
router.get("/", asyncHandler(list));
router.post("/", asyncHandler(create));
router.put("/:id", asyncHandler(update));
router.delete("/:id", asyncHandler(destroy));

export default router;
