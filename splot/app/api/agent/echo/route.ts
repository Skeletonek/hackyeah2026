import { createSkillHandler } from "@/lib/ai/handler";
import { defineSkill } from "@/lib/ai/skill";
import { askQuestionTool } from "@/lib/ai/tools";

/** Dev-only demo Skill that proves the lib/ai loop; delete once Matchmaking lands. */
const echoSkill = defineSkill({
  name: "echo",
  system:
    "Jesteś testowym asystentem platformy Splot. Odpowiadaj po polsku, jednym lub dwoma krótkimi zdaniami, i powtórz własnymi słowami, co napisała osoba. Gdy osoba poprosi o pytanie, użyj narzędzia askQuestion, a po odpowiedzi potwierdź, co wybrała.",
  tools: { askQuestion: askQuestionTool },
});

const handler = createSkillHandler(echoSkill);

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  return handler(request);
}
