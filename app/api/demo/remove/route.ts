import { NextResponse } from "next/server";
import { requireUserAndWedding } from "@/lib/auth/session";
import { removeDemoData } from "@/lib/db/repo";

export async function POST() {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  removeDemoData(ctx.wedding.id);
  return NextResponse.json({ ok: true });
}
