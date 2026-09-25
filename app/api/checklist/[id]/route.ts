import { NextRequest, NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { deleteChecklistItem, updateChecklistItem } from "@/lib/db/repo";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  updateChecklistItem(ctx.wedding.id, id, {
    nome: body.nome ?? "",
    prazo: body.prazo || null,
    responsavel: body.responsavel ?? "",
    status: body.status ?? "pendente",
    observacao: body.observacao ?? "",
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  deleteChecklistItem(ctx.wedding.id, id);
  return NextResponse.json({ ok: true });
}
