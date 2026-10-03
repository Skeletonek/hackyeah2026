import "server-only";
import { embed as embedValue } from "ai";

/** 1536 dimensions, same model as the import pipeline (`innovations.embedding`). */
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function embed(text: string): Promise<number[]> {
  const { embedding } = await embedValue({ model: EMBEDDING_MODEL, value: text });
  return embedding;
}
