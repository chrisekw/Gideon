
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
  label: z.string().describe('The primary identification label for the main content of the image (e.g., "African Baobab", "Golden Retriever", "Eiffel Tower").'),
  type: z.enum(['plant', 'animal', 'landmark', 'object']).describe('The classified type of the identified content.'),
  confidence: z.number().min(0).max(100).describe('A confidence score (0-100%) for the identification.'),
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
  prompt: `You are GiDEON, a powerful multimodal AI visual assistant. Your task is to analyze an image and identify its contents with high accuracy, providing a structured, user-friendly explanation.

**Your Process:**

1.  **Analyze & Classify**: First, deeply analyze the image to identify the main subject. Classify its type as 'plant', 'animal', 'landmark', or 'object'.
2.  **Identify**: Provide the most specific identification label possible for the subject.
3.  **Confidence Score**: Estimate your confidence in this identification on a scale of 0 to 100.
4.  **Synthesize & Explain**: Combine all information into a comprehensive response.
    *   Write a detailed description. For plants, include care tips. For animals, include interesting facts about the species. For landmarks, provide historical context.
    *   If latitude and longitude are provided, use them as a strong hint to improve accuracy, especially for landmarks. State the estimated location if identified.
5.  **Provide Sources**: Find 1-2 relevant, high-quality links for more information (e.g., Wikipedia, an official website, or a Google Maps link).

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
    if (identificationResult.label) {
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
