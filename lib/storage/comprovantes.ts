import path from "path";
import fs from "fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { uploadsDir } from "@/lib/db";

const BUCKET = "comprovantes";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

declare global {
  // eslint-disable-next-line no-var
  var __wfSupabase: SupabaseClient | undefined;
}

/**
 * Returns a Supabase client for server-side storage access, or null when the
 * project isn't configured with Supabase Storage credentials (e.g. local
 * dev without those env vars) — callers fall back to local disk in that case.
 */
function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  if (!global.__wfSupabase) {
    global.__wfSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return global.__wfSupabase;
}

export function comprovantesUsingSupabase(): boolean {
  return getSupabase() !== null;
}

/**
 * Uploads a comprovante file. On Vercel/production (Supabase configured)
 * this goes to Supabase Storage, which persists across instances/cold
 * starts — unlike the local /tmp filesystem, which is ephemeral there and
 * not shared between serverless instances. Falls back to local disk when
 * Supabase isn't configured (e.g. plain local dev).
 */
export async function uploadComprovante(filename: string, buffer: Buffer, contentType?: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
      contentType: contentType || "application/octet-stream",
      upsert: true,
    });
    if (error) throw new Error(`Falha ao enviar comprovante para o Supabase Storage: ${error.message}`);
    return;
  }
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
}

/** Returns the file's bytes, or null when it doesn't exist. */
export async function downloadComprovante(filename: string): Promise<Buffer | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.storage.from(BUCKET).download(filename);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}
