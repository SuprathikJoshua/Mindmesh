import { Router } from "express";
import {
	createSessionHandler,
	getSessionsHandler,
	getSessionHandler,
	endSessionHandler,
} from "../controllers/session.controller";
import { getMessages, sendMessage } from "../controllers/message.controller";
import { validate } from "../middleware/validate.middleware";
import { createSessionSchema } from "../validators/session.validator";
import { validate as validateMessage } from "../middleware/validate.middleware";
import { sendMessageSchema } from "../validators/message.validator";

const router = Router({ mergeParams: true });

router.post("/", validate(createSessionSchema), createSessionHandler);
router.get("/", getSessionsHandler);
router.get("/:id", getSessionHandler);
router.post("/:id/end", endSessionHandler);

router.get("/:id/messages", getMessages);
router.post("/:id/messages", validateMessage(sendMessageSchema), sendMessage);

export default router;