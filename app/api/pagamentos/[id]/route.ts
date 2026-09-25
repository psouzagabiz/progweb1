import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { deletePagamento } from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

export const DELETE = withApiError("DELETE /api/pagamentos/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await deletePagamento(ctx.wedding.id, id);
  return NextResponse.json({ ok: true });
});
