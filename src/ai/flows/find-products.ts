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
  prompt: `You are an expert personal shopper AI. Your task is to find the exact product shown in the user's image. Follow these steps carefully:

1.  **Analyze the Image**: First, carefully describe the main product in the image to yourself, noting key visual details like color, shape, material, and any visible logos or text.
2.  **Generate Search Keywords**: Based on your analysis, generate a few specific search keywords that you would use to find this product online.
3.  **Search and Retrieve**: Using your internal knowledge and web search capabilities, find the product on various online marketplaces.
4.  **Filter and Verify**: From the search results, select only the products that are the best visual and descriptive match for the item in the image. Ensure the shopping links are valid and lead to a purchase page.
5.  **Format the Output**: For each of the top matching products you find, provide the details as specified in the output schema.

Return the top results. If you cannot find any matching products, return an empty array.

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
