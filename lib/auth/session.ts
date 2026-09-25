import { auth } from "@/lib/auth";
import { getOrCreateWedding } from "@/lib/db/repo";

/** Server-side helper: returns the authenticated user's id and their primary wedding, or null. */
export async function requireUserAndWedding() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const wedding = getOrCreateWedding(session.user.id);
  return { userId: session.user.id, wedding };
}
