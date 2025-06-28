
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

const IdentifyObjectOutputSchema = z.object({
  identification: z.string().describe('The primary identification of the main object, plant, animal, or landmark in the image.'),
  description: z.string().describe('A detailed description of the identified item. If it is a plant, include care tips. If it is a landmark, include interesting facts.'),
  location: z.string().optional().describe('The guessed location (e.g., city, country) if a landmark or strong geographical clues are present.'),
  sources: z.array(z.object({
    title: z.string().describe('The title of the source website (e.g., "Wikipedia").'),
    link: z.string().describe('A relevant URL for more information (e.g., a Wikipedia page or Google Maps link).'),
  })).optional().describe("A list of relevant links for more information."),
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
  prompt: `You are a world-class AI identification expert. Your task is to analyze an image and identify its contents by following a structured process.

**Your Process:**

1.  **Categorize**: First, determine the primary category of the image subject: Is it a plant, animal, landmark, or a general object?
2.  **Analyze**: Based on the category, perform a specialized analysis.
    *   **If it's a plant or animal**: Use your knowledge base to find its species name.
    *   **If it's a landmark**: Identify its name. If latitude and longitude are provided, use them as a strong hint to improve the accuracy of your identification.
    *   **If it's a general object**: Identify the object and its purpose.
3.  **Synthesize & Explain**: Combine all the information you've gathered into a comprehensive response.
    *   Provide the primary identification.
    *   Write a detailed description. If it's a plant, include care tips. If it's a landmark, include interesting facts.
    *   If you identified a location, state it clearly. Use the provided coordinates to refine the location if available.
4.  **Provide Sources**: Find 1-2 relevant, high-quality links for more information, such as a Wikipedia page, an official website, or a Google Maps link.

Format your response strictly according to the output schema.

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

    // Step 2: Generate a visually similar image if identification was successful
    if (identificationResult.identification) {
      try {
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: `A high-quality, clear, photorealistic image of a single "${identificationResult.identification}". The object should be centered against a plain, neutral background.`,
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
        // The user will still get the text-based identification.
      }
    }

    // Step 3: Combine text identification with the generated image URL
    return {
      ...identificationResult,
      generatedImageUrl,
    };
  }
);
