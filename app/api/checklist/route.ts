import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { createChecklistItem, listChecklist } from "@/lib/db/repo";

export async function GET() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(listChecklist(ctx.wedding.id));
}

export async function POST(req: NextRequest) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = createChecklistItem(ctx.wedding.id, {
    nome: body.nome ?? "",
    prazo: body.prazo || null,
    responsavel: body.responsavel ?? "",
    status: body.status ?? "pendente",
    observacao: body.observacao ?? "",
  });
  return NextResponse.json({ id });
}
