import { NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { removeDemoData } from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

export const POST = withApiError("POST /api/demo/remove", async () => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await removeDemoData(ctx.wedding.id);
  return NextResponse.json({ ok: true });
});
