export type EmbeddingTextInput = {
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
};

/**
 * The text an innovation's embedding is computed from. The import script and
 * the admin editor share it, so either one can tell when the vector is stale.
 */
export function innovationEmbeddingText(item: EmbeddingTextInput) {
  return [item.title, item.lead, item.solution, item.problem, item.audience].filter(Boolean).join("\n\n");
}
