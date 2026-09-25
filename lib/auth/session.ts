import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { getOrCreateWedding } from "@/lib/db/repo";

const DEMO_USER_EMAIL = "convidado@exemplo.com";

/**
 * The app runs open (no login) for visualization purposes: everyone shares
 * a single fixed "guest" user/wedding, created on first access.
 */
function getOrCreateDemoUserId(): string {
  const db = getDb();
  let user = db.prepare("SELECT id FROM users WHERE email = ?").get(DEMO_USER_EMAIL) as
    | { id: string }
    | undefined;
  if (!user) {
    const id = randomUUID();
    db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)").run(
      id,
      "Convidado",
      DEMO_USER_EMAIL,
      ""
    );
    user = { id };
  }
  return user.id;
}

/** Server-side helper: returns the current user's id and their primary wedding. Never null — the app has no login gate. */
export async function requireUserAndWedding() {
  const userId = getOrCreateDemoUserId();
  const wedding = getOrCreateWedding(userId);
  return { userId, wedding };
}
