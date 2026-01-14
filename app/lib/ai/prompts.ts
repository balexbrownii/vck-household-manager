/**
 * Prompt templates for AI photo evaluation
 * Includes learned patterns from parent feedback
 */

import { EntityType, AIRules } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

/**
 * Learned pattern from parent feedback
 */
interface LearnedPattern {
  type: 'false_positive' | 'false_negative'
  description: string
  parentFeedback: string | null
}

/**
 * Explicit example added by parent
 */
interface LearnedExample {
  type: 'should_pass' | 'should_fail'
  description: string
  reason: string
}

/**
 * Fetch recent learning signals for an entity type
 * These help the AI calibrate its decisions based on past parent feedback
 */
export async function getLearnedPatterns(
  entityType: EntityType,
  entityId?: string
): Promise<{ patterns: LearnedPattern[]; examples: LearnedExample[] }> {
  try {
    const supabase = await createClient()

    // Get recent disagreements (last 20) for this entity type
    const { data: signals } = await supabase
      .from('ai_feedback_signals')
      .select('signal_type, kid_notes, parent_feedback')
      .eq('entity_type', entityType)
      .neq('signal_type', 'agreement')
      .order('created_at', { ascending: false })
      .limit(20)

    const patterns: LearnedPattern[] = (signals || []).map(s => ({
      type: s.signal_type as 'false_positive' | 'false_negative',
      description: s.kid_notes || 'No description',
      parentFeedback: s.parent_feedback,
    }))

    // Get active learned examples
    let examplesQuery = supabase
      .from('ai_learned_examples')
      .select('example_type, description, reason')
      .eq('entity_type', entityType)
      .eq('active', true)

    if (entityId) {
      examplesQuery = examplesQuery.or(`entity_id.eq.${entityId},entity_id.is.null`)
    } else {
      examplesQuery = examplesQuery.is('entity_id', null)
    }

    const { data: examplesData } = await examplesQuery.limit(10)

    const examples: LearnedExample[] = (examplesData || []).map(e => ({
      type: e.example_type as 'should_pass' | 'should_fail',
      description: e.description,
      reason: e.reason,
    }))

    return { patterns, examples }
  } catch (error) {
    console.error('Error fetching learned patterns:', error)
    return { patterns: [], examples: [] }
  }
}

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
 * Build the user prompt with rules, kid's notes, and learned patterns
 */
export function buildUserPrompt(
  rules: AIRules,
  kidNotes: string | null,
  patterns?: LearnedPattern[],
  examples?: LearnedExample[]
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

  // Add learned patterns from parent feedback
  if (patterns && patterns.length > 0) {
    const falsePositives = patterns.filter(p => p.type === 'false_positive')
    const falseNegatives = patterns.filter(p => p.type === 'false_negative')

    if (falsePositives.length > 0) {
      prompt += `

CALIBRATION - CASES WHERE AI WAS TOO LENIENT (parent rejected what AI approved):
${falsePositives.slice(0, 5).map(p => `- "${p.description}"${p.parentFeedback ? ` → Parent said: "${p.parentFeedback}"` : ''}`).join('\n')}
Consider being more careful about similar situations.`
    }

    if (falseNegatives.length > 0) {
      prompt += `

CALIBRATION - CASES WHERE AI WAS TOO STRICT (parent approved what AI rejected):
${falseNegatives.slice(0, 5).map(p => `- "${p.description}"${p.parentFeedback ? ` → Parent said: "${p.parentFeedback}"` : ''}`).join('\n')}
Consider being more accepting of similar situations.`
    }
  }

  // Add explicit learned examples from parents
  if (examples && examples.length > 0) {
    const shouldPass = examples.filter(e => e.type === 'should_pass')
    const shouldFail = examples.filter(e => e.type === 'should_fail')

    if (shouldPass.length > 0) {
      prompt += `

PARENT GUIDANCE - EXAMPLES THAT SHOULD PASS:
${shouldPass.map(e => `- ${e.description} (Reason: ${e.reason})`).join('\n')}`
    }

    if (shouldFail.length > 0) {
      prompt += `

PARENT GUIDANCE - EXAMPLES THAT SHOULD NOT PASS:
${shouldFail.map(e => `- ${e.description} (Reason: ${e.reason})`).join('\n')}`
    }
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
