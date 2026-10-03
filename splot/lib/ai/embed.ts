import "server-only";
import { embed as embedValue } from "ai";
import { EMBEDDING_MODEL } from "./models";

export async function embed(text: string): Promise<number[]> {
  const { embedding } = await embedValue({ model: EMBEDDING_MODEL, value: text });
  return embedding;
}
