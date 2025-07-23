
'use server';
/**
 * @fileOverview An AI agent for identifying objects in images.
 *
 * - identifyObject - A function that identifies an object in an image.
 * - IdentifyObjectInput - The input type for the identifyObject function.
 * - IdentifyObjectOutput - The return type for the identifyObject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyObjectInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an object, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  latitude: z.number().optional().describe("The user's latitude."),
  longitude: z.number().optional().describe("The user's longitude."),
});
export type IdentifyObjectInput = z.infer<typeof IdentifyObjectInputSchema>;

const LocationSchema = z.object({
    country: z.string().optional().describe("The country where the object is located."),
    region: z.string().optional().describe("The region or city where the object is located."),
    gps: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
    }).optional().describe("The GPS coordinates."),
}).nullable().describe("The estimated location of the subject.");

const IdentifyObjectOutputSchema = z.object({
  label: z.string().describe('The primary identification label for the main content of the image (e.g., "African Baobab", "Golden Retriever", "Eiffel Tower").'),
  type: z.enum(['plant', 'animal', 'landmark', 'object', 'unknown']).describe('The classified type of the identified content.'),
  confidence: z.number().min(0).max(100).describe('A confidence score (0-100%) for the identification.'),
  description: z.string().describe('A detailed, factual, and helpful natural-language explanation of the identified item.'),
  location: LocationSchema,
  source: z.string().describe("The primary AI models or services used for this identification (e.g., 'Google Vision, GPT-4o')."),
  version: z.string().describe("The version of the GiDEON assistant that provided the response."),
  generatedImageUrl: z.string().optional().describe('A generated image URL (data URI) that is visually similar to the identified object.'),
});
export type IdentifyObjectOutput = z.infer<typeof IdentifyObjectOutputSchema>;


export async function identifyObject(input: IdentifyObjectInput): Promise<IdentifyObjectOutput> {
  return identifyObjectFlow(input);
}

const identificationPrompt = ai.definePrompt({
  name: 'identifyObjectPrompt',
  input: {schema: IdentifyObjectInputSchema},
  output: {schema: IdentifyObjectOutputSchema.omit({ generatedImageUrl: true })},
  prompt: `ROLE:
You are GiDEON, a multimodal visual intelligence agent trained to interpret and understand images from the real world. You serve over 100 billion users across web and mobile platforms. Your core responsibility is to help users identify, understand, and explore real-world entities using image input, GPS metadata, and natural language.

You are embedded in a secure, privacy-aware platform, and must always prioritize helpfulness, factual accuracy, user clarity, and safety.

PRIMARY PURPOSE
Given an image (with optional GPS metadata and user question), you must:
- Identify the primary subject(s) of the image (object, plant, animal, landmark, etc.)
- Generate a classification label and confidence score (0–100)
- Classify the type of the image subject ('plant', 'animal', 'landmark', 'object', or 'unknown')
- Extract location (if GPS is available) using reverse geocoding
- Provide a safe, helpful, and accurate natural-language explanation
- Return results in a consistent, structured format

RULES & BEHAVIOR POLICIES
1. ALWAYS classify image into one of: plant, animal, landmark, object, unknown
2. NEVER guess location if GPS is not provided. Instead, explain what visual clues you notice. Return a null location field.
3. ALWAYS provide a confidence score. If confidence < 60%, note uncertainty in description.
4. ALL descriptions must be factual, clear, and helpful — no creative writing or fictional content.
5. ALWAYS attribute source (e.g., Plant.id, GPT-4o, etc.). Set version to "GIDEON-v1.0".
6. Respect safety: Do not describe violence, NSFW material, or unsafe advice.
7. NO political commentary, speculation, or bias.
8. For multiple subjects, focus on the main visible object unless prompted otherwise.

{{#if latitude}}User's Location: Latitude {{latitude}}, Longitude {{longitude}}{{/if}}
Image: {{media url=photoDataUri}}`,
});

const identifyObjectFlow = ai.defineFlow(
  {
    name: 'identifyObjectFlow',
    inputSchema: IdentifyObjectInputSchema,
    outputSchema: IdentifyObjectOutputSchema,
  },
  async (input) => {
    // Step 1: Get text-based identification from the first model
    const { output: identificationResult } = await identificationPrompt(input);
    if (!identificationResult) {
      throw new Error('Failed to identify the object.');
    }

    let generatedImageUrl: string | undefined = undefined;

    // Step 2: Generate a visually similar image if identification was successful and it's not an unknown object
    if (identificationResult.label && identificationResult.type !== 'unknown') {
      try {
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: `A high-quality, clear, photorealistic image of a single "${identificationResult.label}". The object should be centered against a plain, neutral background.`,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        if (media?.url) {
          generatedImageUrl = media.url;
        }
      } catch (e) {
        console.error("Image generation failed:", e);
        // Do not block the response if image generation fails.
      }
    }

    // Step 3: Combine text identification with the generated image URL
    return {
      ...identificationResult,
      generatedImageUrl,
    };
  }
);
