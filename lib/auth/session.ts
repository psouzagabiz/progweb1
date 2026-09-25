import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { getOrCreateWedding } from "@/lib/db/repo";

const DEMO_USER_EMAIL = "convidado@exemplo.com";

/**
 * The app runs open (no login) for visualization purposes: everyone shares
 * a single fixed "guest" user/wedding, created on first access.
 */
async function getOrCreateDemoUserId(): Promise<string> {
  const db = await getDb();
  const res = await db.query("SELECT id FROM users WHERE email = $1", [DEMO_USER_EMAIL]);
  let user = res.rows[0] as { id: string } | undefined;
  if (!user) {
    const id = randomUUID();
    await db.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES ($1,$2,$3,$4)",
      [id, "Convidado", DEMO_USER_EMAIL, ""]
    );
    user = { id };
  }
  return user.id;
}

/** Server-side helper: returns the current user's id and their primary wedding. Never null — the app has no login gate. */
export async function requireUserAndWedding() {
  const userId = await getOrCreateDemoUserId();
  const wedding = await getOrCreateWedding(userId);
  return { userId, wedding };
}
