import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are a helpful recipe assistant for the Brown Family Diet app.
The family focuses on nutrient-dense meals, especially:
- High potassium (target: 4700mg/day)
- Adequate protein (target: 50g/day)
- Folate, B12, Vitamin C, Magnesium

When asked to find or suggest recipes, provide 2-3 options in a specific JSON format.

For each recipe, estimate realistic nutritional values based on standard portions.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "message": "Brief friendly response about what you found",
  "recipes": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "category": "breakfast|lunch|dinner|snack|dessert|drink",
      "estimated_minutes": 30,
      "servings": 4,
      "calories": 350,
      "protein_g": 25,
      "potassium_mg": 800,
      "folate_mcg": 100,
      "b12_mcg": 2.5,
      "vitamin_c_mg": 30,
      "magnesium_mg": 50,
      "ingredients": [
        {"item": "Ingredient name", "amount": "1", "unit": "cup", "note": "optional prep note"}
      ],
      "instructions": [
        "Step 1 instruction",
        "Step 2 instruction"
      ]
    }
  ]
}

If the user asks a general question or wants to chat, set recipes to an empty array and just provide a helpful message.`

export async function POST(request: Request) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Build messages array from conversation history
    const messages: Anthropic.MessageParam[] = []

    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: message,
    })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages,
    })

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'No text response from AI' },
        { status: 500 }
      )
    }

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(textBlock.text)
      return NextResponse.json(parsed)
    } catch {
      // If not valid JSON, return as message only
      return NextResponse.json({
        message: textBlock.text,
        recipes: [],
      })
    }
  } catch (error) {
    console.error('Error in AI recipe find:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
