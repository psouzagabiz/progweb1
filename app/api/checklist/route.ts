import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { createChecklistItem, listChecklist } from "@/lib/db/repo";
import { withApiError } from "@/lib/api/errors";

export const GET = withApiError("GET /api/checklist", async () => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await listChecklist(ctx.wedding.id));
});

export const POST = withApiError("POST /api/checklist", async (req: NextRequest) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = await createChecklistItem(ctx.wedding.id, {
    nome: body.nome ?? "",
    prazo: body.prazo || null,
    responsavel: body.responsavel ?? "",
    status: body.status ?? "pendente",
    observacao: body.observacao ?? "",
  });
  return NextResponse.json({ id });
});
