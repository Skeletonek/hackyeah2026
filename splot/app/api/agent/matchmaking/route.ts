import { createSkillHandler } from "@/lib/ai/handler";
import { matchmakingSkill } from "@/lib/matchmaking/skill";

export const POST = createSkillHandler(matchmakingSkill);
