import "server-only";

/**
 * Contract stub: the signature is final, the body is a no-op. Admin panel
 * replaces it (A1: AI suggests category, priority and a possible duplicate).
 */
export async function triageSubmission(id: string): Promise<void> {
  void id;
}
