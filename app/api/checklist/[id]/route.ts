import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { deleteChecklistItem, updateChecklistItem } from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

export const PUT = withApiError("PUT /api/checklist/[id]", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  await updateChecklistItem(ctx.wedding.id, id, {
    nome: body.nome ?? "",
    prazo: body.prazo || null,
    responsavel: body.responsavel ?? "",
    status: body.status ?? "pendente",
    observacao: body.observacao ?? "",
  });
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiError("DELETE /api/checklist/[id]", async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteChecklistItem(ctx.wedding.id, id);
  return NextResponse.json({ ok: true });
});
