import { z } from "zod";

export const createSessionSchema = z.object({
	moodScore: z.number().int().min(1).max(5),
	moodNote: z.string().max(500).optional(),
});

export const sendMessageSchema = z.object({
	content: z.string().min(1).max(2000).transform((v) => v.trim()),
});