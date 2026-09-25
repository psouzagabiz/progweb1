import { NextResponse } from "next/server";

/**
 * Wraps a Next.js route handler so any thrown error is logged server-side
 * (visible in Vercel function logs) and returned as a JSON 500 instead of
 * crashing silently or letting Next.js swallow the stack trace.
 */
export function withApiError<Args extends unknown[]>(
  routeLabel: string,
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`${routeLabel} failed`, err);
      return NextResponse.json(
        { error: String(err instanceof Error ? err.message : err) },
        { status: 500 }
      );
    }
  };
}
