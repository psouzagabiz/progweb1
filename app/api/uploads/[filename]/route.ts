import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { requireUserAndWedding } from "@/lib/auth/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const ctx = await requireUserAndWedding();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { filename } = await params;
  const safe = path.basename(filename);
  const filePath = path.join(process.cwd(), "uploads", safe);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: { "Content-Type": "application/octet-stream" },
  });
}
