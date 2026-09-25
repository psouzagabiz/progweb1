import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireUserAndWedding } from "@/lib/auth/session";
import { downloadComprovante } from "@/lib/storage/comprovantes";
import { withApiError } from "@/lib/api/errors";

export const GET = withApiError("GET /api/uploads/[filename]", async (_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) => {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { filename } = await params;
  const safe = path.basename(filename);
  const buffer = await downloadComprovante(safe);
  if (!buffer) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/octet-stream" },
  });
});
