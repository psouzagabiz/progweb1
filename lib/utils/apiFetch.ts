import { toast } from "sonner";

/**
 * fetch() wrapper for client components: shows a friendly error toast when
 * the response isn't ok (or the request itself throws, e.g. network error),
 * so a failed mutation is never silently treated as a success by the UI.
 * Returns the Response on success, or null on failure (already toasted).
 */
export async function fetchOrToast(
  input: RequestInfo | URL,
  init?: RequestInit,
  errorPrefix = "Erro"
): Promise<Response | null> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      toast.error(`${errorPrefix}: ${text || res.statusText}`);
      return null;
    }
    return res;
  } catch (err) {
    toast.error(`${errorPrefix}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
