import { createSkillHandler } from "@/lib/ai/handler";
import { ideaAssistantSkill } from "@/lib/ideas/skill";

export const POST = createSkillHandler(ideaAssistantSkill);