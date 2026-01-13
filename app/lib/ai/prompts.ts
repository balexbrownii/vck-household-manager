/**
 * Prompt templates for AI photo evaluation
 */

import { EntityType, AIRules } from '@/types/database'

/**
 * Build the system prompt for Claude based on entity type
 */
export function buildSystemPrompt(entityType: EntityType): string {
  const entityName = {
    gig: 'extra task (gig)',
    chore: 'daily chore',
    expectation: 'daily expectation',
  }[entityType]

  return `You are a helpful household task reviewer for a family app called StarKids.
Your job is to evaluate whether a child (ages 8-13) has completed their assigned ${entityName} based on a photo they submitted and their description of what they did.

IMPORTANT GUIDELINES:
- Be encouraging and supportive - these are kids learning responsibility
- Focus on objective completion criteria
- Give specific, actionable feedback if the task needs improvement
- Use kid-friendly language that's easy to understand
- If you can't determine completion from the photo, kindly ask for a clearer photo
- Err on the side of being helpful rather than strict
- Celebrate effort even when asking for improvements

You are reviewing a ${entityName} submission.

Respond in JSON format ONLY (no markdown, no code blocks, just raw JSON):
{
  "passed": boolean,
  "confidence": number (0.0-1.0),
  "feedback": "string - encouraging message if passed, helpful suggestions if not",
  "checklist_assessment": [
    {"item": "checklist item text", "passed": boolean, "note": "optional helpful note"}
  ]
}

FEEDBACK TONE EXAMPLES:
- GOOD (passed): "Awesome job! The kitchen looks spotless - counters are clean, dishes are done, and the floor is swept. Great work! ⭐"
- GOOD (needs work): "Great start! I can see you wiped the counters really well. Just a couple things to finish up: the dishes in the sink need to be loaded in the dishwasher, and there are a few crumbs on the floor by the table. You're almost there!"
- BAD: "The kitchen is not clean. You didn't do the dishes." (too harsh, not helpful)`
}

/**
 * Build the user prompt with rules and kid's notes
 */
export function buildUserPrompt(
  rules: AIRules,
  kidNotes: string | null
): string {
  let prompt = `Please evaluate this photo submission.

TASK SCOPE:
${rules.scope_description}

COMPLETION CRITERIA:
${rules.completion_criteria}`

  if (rules.checklist && rules.checklist.length > 0) {
    prompt += `

CHECKLIST ITEMS TO VERIFY:
${rules.checklist.map((item, i) => `${i + 1}. ${item}`).join('\n')}`
  }

  if (kidNotes) {
    prompt += `

WHAT THE CHILD SAID THEY DID:
"${kidNotes}"

Consider this description when evaluating - it provides context for what you're seeing in the photo.`
  }

  prompt += `

Please assess whether the photo demonstrates that the task was completed according to the criteria above. Be thorough but encouraging.`

  return prompt
}

/**
 * Feedback templates for common scenarios
 */
export const feedbackTemplates = {
  photoUnclear: "I had trouble seeing the details in this photo. Could you take another one with better lighting or a clearer angle? I want to make sure I can see all your great work!",

  almostThere: (missingItems: string[]) =>
    `You're so close! Great effort so far. Just a few more things to finish up: ${missingItems.join(', ')}. You've got this!`,

  excellent: (highlights: string[]) =>
    `Excellent work! ${highlights.join(' ')} Keep up the amazing effort! ⭐`,

  goodStart: (completed: string[], remaining: string[]) =>
    `Good start! I can see you ${completed.join(' and ')}. Now let's finish up: ${remaining.join(', ')}. Almost there!`,
}
