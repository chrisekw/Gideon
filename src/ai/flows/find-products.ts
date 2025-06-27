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
    name: z.string().describe('The name of the product.'),
    brand: z.string().describe('The brand of the product.'),
    price: z.string().describe('The price of the product, including currency symbol (e.g., $, €).'),
    link: z.string().describe('A shopping link for the product. It must be a valid URL.'),
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
  prompt: `You are an expert personal shopper. Your task is to identify commercially available products in the provided image by searching the internet.

For each product you identify, provide its name, brand, price (including currency), and a valid, working URL to an online store where it can be purchased. Do your best to find the exact product and real shopping links. If you cannot find any products, return an empty array.

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
