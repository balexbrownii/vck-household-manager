/**
 * Claude Vision API wrapper for photo evaluation
 * Includes learned patterns from parent feedback to improve accuracy
 */

import Anthropic from '@anthropic-ai/sdk'
import { EntityType, AIRules, AIEvaluationResult } from '@/types/database'
import { buildSystemPrompt, buildUserPrompt, getLearnedPatterns } from './prompts'

// Initialize Anthropic client
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new Anthropic({ apiKey })
}

/**
 * Evaluate a photo submission using Claude's vision capabilities
 *
 * @param imageUrl - Public URL of the photo to evaluate
 * @param rules - The evaluation rules (scope, criteria, checklist)
 * @param entityType - Type of task (gig, chore, expectation)
 * @param kidNotes - What the kid said they did (provides context)
 * @param entityId - Optional entity ID for entity-specific learned patterns
 * @returns Evaluation result with pass/fail, feedback, and confidence
 */
export async function evaluatePhoto(
  imageUrl: string,
  rules: AIRules,
  entityType: EntityType,
  kidNotes: string | null,
  entityId?: string
): Promise<AIEvaluationResult> {
  const client = getClient()

  // Fetch learned patterns from parent feedback
  const { patterns, examples } = await getLearnedPatterns(entityType, entityId)

  const systemPrompt = buildSystemPrompt(entityType)
  const userPrompt = buildUserPrompt(rules, kidNotes, patterns, examples)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    const result = parseAIResponse(textContent.text)
    return result
  } catch (error) {
    console.error('Claude Vision API error:', error)

    // Return a fallback response that escalates to parent
    return {
      passed: false,
      feedback:
        "I had some trouble evaluating this submission. Let's have a parent take a look to make sure you get credit for your work!",
      confidence: 0,
      checklist_assessment: [],
    }
  }
}

/**
 * Parse Claude's JSON response into AIEvaluationResult
 */
function parseAIResponse(responseText: string): AIEvaluationResult {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (typeof parsed.passed !== 'boolean') {
      throw new Error('Missing or invalid "passed" field')
    }
    if (typeof parsed.feedback !== 'string') {
      throw new Error('Missing or invalid "feedback" field')
    }

    return {
      passed: parsed.passed,
      feedback: parsed.feedback,
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
      checklist_assessment: Array.isArray(parsed.checklist_assessment)
        ? parsed.checklist_assessment.map((item: unknown) => {
            const typedItem = item as Record<string, unknown>
            return {
              item: String(typedItem.item || ''),
              passed: Boolean(typedItem.passed),
              note: typedItem.note ? String(typedItem.note) : undefined,
            }
          })
        : undefined,
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error, responseText)

    // Return a safe fallback
    return {
      passed: false,
      feedback:
        "I had trouble processing this photo. Let's have a parent review it to make sure you get credit!",
      confidence: 0,
    }
  }
}

/**
 * Check if the API key is configured
 */
export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}
