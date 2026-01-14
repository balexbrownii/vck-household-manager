/**
 * AI-powered nutrition calculator for ad-hoc meals
 * Uses Claude to parse meal descriptions and estimate nutritional content
 */

import Anthropic from '@anthropic-ai/sdk'

interface MealComponent {
  name: string
  amount: string
  unit: string
}

export interface NutritionResult {
  components: MealComponent[]
  calories: number
  protein_g: number
  potassium_mg: number
  folate_mcg: number
  b12_mcg: number
  vitamin_c_mg: number
  magnesium_mg: number
  fiber_g: number
  confidence: number
  notes: string | null
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new Anthropic({ apiKey })
}

const SYSTEM_PROMPT = `You are a nutrition expert assistant. Your task is to analyze meal descriptions and estimate their nutritional content.

When given a meal description, you should:
1. Parse it into individual food components with estimated portions
2. Calculate total nutritional values per serving
3. Be conservative in estimates - it's better to slightly underestimate than overestimate
4. Focus on accuracy for the key nutrients: calories, protein, potassium, folate, B12, vitamin C, magnesium, and fiber

Always respond with a JSON object in this exact format:
{
  "components": [
    {"name": "food item", "amount": "quantity", "unit": "unit of measurement"}
  ],
  "nutrition": {
    "calories": <number>,
    "protein_g": <number>,
    "potassium_mg": <number>,
    "folate_mcg": <number>,
    "b12_mcg": <number>,
    "vitamin_c_mg": <number>,
    "magnesium_mg": <number>,
    "fiber_g": <number>
  },
  "confidence": <0.0 to 1.0>,
  "notes": "<any important caveats or assumptions, or null if none>"
}

Guidelines:
- Assume standard serving sizes if not specified (e.g., 4oz meat, 1 cup vegetables)
- For homemade dishes, estimate based on typical recipes
- If the description is vague, make reasonable assumptions and note them
- Confidence should reflect how precise your estimate is (0.9+ for clear items, 0.6-0.8 for estimates, below 0.6 for very vague)
- Round calories and mg values to whole numbers
- Round grams to one decimal place`

/**
 * Calculate nutrition for a meal description using AI
 */
export async function calculateNutrition(
  mealDescription: string,
  servings: number = 1
): Promise<NutritionResult> {
  const client = getClient()

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please analyze this meal and calculate its nutritional content for ${servings} serving(s):

"${mealDescription}"

Provide the nutrition per serving.`,
        },
      ],
    })

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    return parseNutritionResponse(textContent.text)
  } catch (error) {
    console.error('Nutrition calculation error:', error)

    // Return fallback with zeros and low confidence
    return {
      components: [{ name: mealDescription, amount: '1', unit: 'serving' }],
      calories: 0,
      protein_g: 0,
      potassium_mg: 0,
      folate_mcg: 0,
      b12_mcg: 0,
      vitamin_c_mg: 0,
      magnesium_mg: 0,
      fiber_g: 0,
      confidence: 0,
      notes: 'Unable to calculate nutrition. Please update manually if needed.',
    }
  }
}

/**
 * Parse Claude's JSON response into NutritionResult
 */
function parseNutritionResponse(responseText: string): NutritionResult {
  try {
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Extract components
    const components: MealComponent[] = Array.isArray(parsed.components)
      ? parsed.components.map((c: Record<string, unknown>) => ({
          name: String(c.name || ''),
          amount: String(c.amount || '1'),
          unit: String(c.unit || 'serving'),
        }))
      : []

    // Extract nutrition values with defaults
    const nutrition = parsed.nutrition || {}

    return {
      components,
      calories: Math.round(Number(nutrition.calories) || 0),
      protein_g: Number((Number(nutrition.protein_g) || 0).toFixed(1)),
      potassium_mg: Math.round(Number(nutrition.potassium_mg) || 0),
      folate_mcg: Math.round(Number(nutrition.folate_mcg) || 0),
      b12_mcg: Number((Number(nutrition.b12_mcg) || 0).toFixed(2)),
      vitamin_c_mg: Math.round(Number(nutrition.vitamin_c_mg) || 0),
      magnesium_mg: Math.round(Number(nutrition.magnesium_mg) || 0),
      fiber_g: Number((Number(nutrition.fiber_g) || 0).toFixed(1)),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      notes: parsed.notes || null,
    }
  } catch (error) {
    console.error('Failed to parse nutrition response:', error, responseText)

    return {
      components: [],
      calories: 0,
      protein_g: 0,
      potassium_mg: 0,
      folate_mcg: 0,
      b12_mcg: 0,
      vitamin_c_mg: 0,
      magnesium_mg: 0,
      fiber_g: 0,
      confidence: 0,
      notes: 'Failed to parse nutrition data. Please update manually.',
    }
  }
}
