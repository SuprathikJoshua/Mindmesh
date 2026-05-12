import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

export const globalErrorHandler = (
	err: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
) => {
	if (err instanceof ApiError) {
		return res.status(err.statusCode).json({
			success: false,
			statusCode: err.statusCode,
			message: err.message,
			errors: err.errors,
		});
	}

	res.status(500).json({
		success: false,
		statusCode: 500,
		message: "Internal server error",
		errors: [],
	});
};