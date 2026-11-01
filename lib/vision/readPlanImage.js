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

/**
 * Extracts structured data from a floor plan image or PDF page.
 * 
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mediaType - The MIME type (e.g., 'image/jpeg', 'application/pdf').
 * @returns {Promise<Object>} The extraction result.
 */
export async function readPlanImage(buffer, mediaType) {
  try {
    const base64Data = buffer.toString('base64');

    // Determine the correct block type for Claude
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
  "floor_area": number (in square metres),
  "wall_length": number (total external + internal perimeter in metres),
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

If a value cannot be determined, omit the key entirely from the JSON. Do not guess wildly.
`;

    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: MODEL_MAX_TOKENS,
      // REMOVED: temperature: MODEL_TEMPERATURE, (Not supported in Claude 5.5)
      messages: [
        {
          role: 'user',
          content: [
            fileBlock,
            {
              type: 'text',
              text: prompt,
            },
          ],
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

    // Extract text from response
    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Parse JSON
    let parsedData;
    try {
      // Strip any accidental markdown block formatting
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse JSON from Claude:', responseText);
      throw new Error('Invalid JSON received from AI.');
    }

    // Validate confidence
    if (parsedData.confidence && parsedData.confidence < CONFIDENCE_MINIMUM) {
      console.warn('Low confidence extraction:', parsedData.confidence);
      // We still return the data, but the UI will flag it as "Partial read"
    }

    return {
      success: true,
      readMethod: 'vision-extraction',
      error: null,
      data: parsedData,
      notes: `Extracted via Vision AI (Confidence: ${Math.round((parsedData.confidence || 0) * 100)}%)`,
      windowsFound: parsedData.windows || 0,
      doorsFound: parsedData.doors || 0,
      roomsFound: parsedData.room_labels ? parsedData.room_labels.split(',') : [],
      dimensionsFound: 1,
      usage,
      fields: parsedData, // Mapping fields for the database
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
