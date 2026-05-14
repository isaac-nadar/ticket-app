import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./errors";

// We use a generic <T> so TypeScript perfectly preserves your 'params' types!
export function withErrorHandler<T>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: T) => {
    try {
      // Execute the actual route logic
      return await handler(req, context);
    } catch (err: unknown) {
      // 1. Is it one of our custom, expected errors?
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, status: err.statusCode },
          { status: err.statusCode },
        );
      }

      // 2. Is it a generic Error (like a null pointer or DB crash)?
      console.error("🚨 [UNHANDLED API ERROR]:", err);

      // We DO NOT send the raw err.message to the client for security!
      return NextResponse.json(
        { error: "Internal Server Error", status: 500 },
        { status: 500 },
      );
    }
  };
}
