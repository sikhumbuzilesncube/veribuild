import Anthropic from '@anthropic-ai/sdk';
import {
  MODEL_ID,
  MODEL_MAX_TOKENS,
  CONFIDENCE_MINIMUM,
  MAX_COST_PER_PLAN_USD,
  estimateCostUsd,
} from './constants';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function readPlanImage(buffer, mediaType) {
  try {
    const base64Data = buffer.toString('base64');

    let fileBlock;
    if (mediaType === 'application/pdf') {
      fileBlock = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Data,
        },
      };
    } else {
      fileBlock = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data,
        },
      };
    }

    const prompt = `
You are an expert Quantity Surveyor and Architect in Zimbabwe.
Analyze the attached floor plan and extract the following information.
Return ONLY a valid JSON object. Do not include markdown formatting, code blocks, or any conversational text.

The JSON must follow this exact structure:
{
  "floor_area": number (total square metres of the building),
  "wall_length": number (total external + internal perimeter in metres. If not explicitly written, estimate it using the formula: 4 * sqrt(floor_area) * 1.2),
  "rooms": number,
  "room_labels": string (comma separated list of rooms found),
  "doors": number,
  "door_details": string (comma separated list of door codes e.g. "D1, D2, DD"),
  "windows": number,
  "window_details": string (comma separated list of window codes e.g. "PT1212, HS1512"),
  "foundation_depth": number (in metres, estimate 0.6 if unknown),
  "wall_thickness": number (in mm, estimate 230 if unknown),
  "plan_notes": string (any written instructions or notes on the plan),
  "confidence": number (0.0 to 1.0, how confident you are in these measurements)
}

CRITICAL INSTRUCTIONS:
1. Always provide a wall_length. If it is not written on the plan, calculate it from the room dimensions.
2. Be confident. If the plan is clear, give a confidence score of 0.90 or higher.
3. If a value cannot be determined, omit the key entirely.
`;

    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: MODEL_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: [fileBlock, { type: 'text', text: prompt }],
        },
      ],
    });

    const usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimatedCostUsd: estimateCostUsd(
        response.usage.input_tokens,
        response.usage.output_tokens
      ),
    };

    if (usage.estimatedCostUsd > MAX_COST_PER_PLAN_USD) {
      throw new Error('Cost limit exceeded for this plan.');
    }

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsedData;
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse JSON from Claude:', responseText);
      throw new Error('Invalid JSON received from AI.');
    }

    return {
      success: true,
      readMethod: 'vision-extraction',
      error: null,
      data: parsedData,
      notes: `Extracted via Vision AI`,
      windowsFound: parsedData.windows || 0,
      doorsFound: parsedData.doors || 0,
      roomsFound: parsedData.room_labels ? parsedData.room_labels.split(',') : [],
      dimensionsFound: 1,
      usage,
      fields: parsedData,
    };

  } catch (error) {
    console.error('readPlanImage error:', error);
    return {
      success: false,
      readMethod: 'vision-failed',
      error: error.message || 'Vision extraction failed',
      data: null,
      notes: 'Could not read plan automatically.',
      windowsFound: 0,
      doorsFound: 0,
      roomsFound: [],
      dimensionsFound: 0,
      fields: {},
    };
  }
      }
