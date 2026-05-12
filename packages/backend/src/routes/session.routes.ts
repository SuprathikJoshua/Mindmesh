import { Router } from "express";
import {
	createSession,
	getSessions,
	getSession,
	endSession,
} from "../controllers/session.controller";
import { validate } from "../middleware/validate.middleware";
import { createSessionSchema } from "../validators/session.validator";
import { getMessages, sendMessage } from "../controllers/message.controller";
import { validate as validateMessage } from "../middleware/validate.middleware";
import { sendMessageSchema } from "../validators/message.validator";

const router = Router({ mergeParams: true });

router.post("/", validate(createSessionSchema), createSession);
router.get("/", getSessions);
router.get("/:id", getSession);
router.post("/:id/end", endSession);

router.get("/:id/messages", getMessages);
router.post("/:id/messages", validateMessage(sendMessageSchema), sendMessage);

export default router;