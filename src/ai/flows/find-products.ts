'use server';
/**
 * @fileOverview An AI agent that finds products in an image and provides shopping links.
 *
 * - findProducts - A function that handles finding products in an image.
 * - FindProductsInput - The input type for the findProducts function.
 * - FindProductsOutput - The return type for the findProducts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindProductsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing products, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FindProductsInput = z.infer<typeof FindProductsInputSchema>;

const ProductSchema = z.object({
    name: z.string().describe("The product's title or name."),
    brand: z.string().describe('The brand of the product.'),
    price: z.string().describe('The price of the product, including currency symbol (e.g., $, €).'),
    link: z.string().describe('A direct shopping link for the product.'),
});

const FindProductsOutputSchema = z.object({
  products: z.array(ProductSchema).describe('A list of products found in the image.'),
});
export type FindProductsOutput = z.infer<typeof FindProductsOutputSchema>;

export async function findProducts(input: FindProductsInput): Promise<FindProductsOutput> {
  return findProductsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findProductsPrompt',
  input: {schema: FindProductsInputSchema},
  output: {schema: FindProductsOutputSchema},
  prompt: `You are a world-class AI personal shopper. Your mission is to find the exact product from a user's image, searching across the internet to provide accurate shopping options.

**Your Process:**

1.  **Image Analysis**: Meticulously analyze the user's image. Identify the main product, noting every visual detail: brand, logos, text, color, material, shape, and unique features.
2.  **Query Generation**: Based on your analysis, generate several powerful search keywords.
    *   **If the image is blurry or of poor quality:** Use your reasoning to infer the user's intent. Generate broader, more descriptive queries to overcome the visual ambiguity.
    *   **For all images:** Create variations of keywords, including synonyms and potential misspellings to ensure a comprehensive search (fuzzy matching).
3.  **Simulated Search & Retrieval**: Using your vast internal knowledge and simulated web search capabilities, find matching products from various online retailers and marketplaces.
4.  **Verification & Sorting**: Critically evaluate the search results.
    *   **Visual Similarity**: Prioritize results that are a strong visual match to the item in the user's photo.
    *   **Textual Match**: Ensure the product title and description align with your analysis.
    *   **Filter out irrelevant items.**
5.  **Format Output**: For the top matching products, provide the product name, brand, price (with currency), and a direct, valid shopping link as specified in the output schema.

If you cannot find any high-confidence matches, return an empty array.

Image: {{media url=photoDataUri}}`,
});

const findProductsFlow = ai.defineFlow(
  {
    name: 'findProductsFlow',
    inputSchema: FindProductsInputSchema,
    outputSchema: FindProductsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
