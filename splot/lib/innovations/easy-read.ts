import "server-only";
import { generateText } from "ai";
import { TEXT_MODEL } from "@/lib/ai/models";

export type EasyReadInput = {
  title: string;
  lead: string | null;
  solution: string | null;
  problem: string | null;
  audience: string | null;
  adopters?: string | null;
  evidence?: string | null;
};

export const EASY_READ_MAX_WORDS = 120;

const SYSTEM = `Piszesz streszczenia innowacji społecznych w tekście łatwym do czytania (easy-read) po polsku. Czytają je seniorzy, osoby z niepełnosprawnością intelektualną i osoby, które słabo znają polski.

Zasady:
- Najwyżej ${EASY_READ_MAX_WORDS} słów.
- Krótkie zdania: jedna myśl w jednym zdaniu, do około 12 słów.
- Proste, codzienne słowa. Bez żargonu, skrótów, angielskich słów i strony biernej. Jeśli trudne słowo jest konieczne, wyjaśnij je.
- Pisz w czasie teraźniejszym, zwracaj się do czytelnika bezpośrednio, gdy to naturalne.
- Kolejność: co to jest, dla kogo, jak pomaga, kto może z tego skorzystać.
- Tylko fakty z opisu. Niczego nie dopisuj.
- Zwykły tekst w 1–3 krótkich akapitach. Bez nagłówków, list, pogrubień i tytułu na początku.`;

/** Writes a Polish easy-read summary (≤ 120 words) of an innovation. */
export async function easyReadSummary(innovation: EasyReadInput): Promise<string> {
  const prompt = formatInnovation(innovation);
  const { text } = await generateText({ model: TEXT_MODEL, system: SYSTEM, prompt });
  const summary = text.trim();
  if (countWords(summary) <= EASY_READ_MAX_WORDS) return summary;

  const { text: shorter } = await generateText({
    model: TEXT_MODEL,
    system: SYSTEM,
    messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: summary },
      {
        role: "user",
        content: `To ma ${countWords(summary)} słów. Skróć do najwyżej ${EASY_READ_MAX_WORDS} słów, zachowaj te same zasady.`,
      },
    ],
  });
  return shorter.trim();
}

export function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function formatInnovation({ title, lead, solution, problem, audience, adopters, evidence }: EasyReadInput) {
  return [
    `Tytuł: ${title}`,
    lead && `Zajawka: ${lead}`,
    solution && `Na czym polega: ${solution}`,
    problem && `Jaki problem rozwiązuje: ${problem}`,
    audience && `Grupa docelowa: ${audience}`,
    adopters && `Kto może skorzystać: ${adopters}`,
    evidence && `Czy to działa: ${evidence}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
