import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import ApiError from "../utils/ApiError";

export const validate = (schema: ZodSchema) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const result = schema.safeParse(req.body);
		if (!result.success) {
			const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
			throw new ApiError(422, "Validation failed", errors);
		}
		req.body = result.data;
		next();
	};
};