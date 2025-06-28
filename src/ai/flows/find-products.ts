
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
      "A photo containing products, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type FindProductsInput = z.infer<typeof FindProductsInputSchema>;

const ProductSchema = z.object({
    name: z.string().describe("The product's title or name."),
    brand: z.string().describe('The brand of the product.'),
    price: z.string().describe('The price of the product, including currency symbol (e.g., $, €).'),
    link: z.string().describe('A direct, valid, and working shopping link for the product. Do not guess or make up a URL.'),
    imageUrl: z.string().describe("A direct, valid, and working URL for the product's image. Do not guess or make up a URL."),
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
  prompt: `You are an expert visual search AI. Your task is to identify the product in the provided image and find it for sale online.

Analyze the image and find purchase links for the main product shown.

You MUST search the following websites for the product:
- Amazon.com
- AliExpress.com
- Temu.com
- Jumia.ng
- eBay.com
- The official brand website, if identifiable.

For each product you find, you must return:
- The product's name.
- The product's brand.
- The price, with currency.
- A direct, working URL to the product page.
- A direct, working URL for the product's image.

**It is crucial that you return real, working links. Do not invent links or image URLs.** Your primary goal is to find at least one valid product. Do not return an empty list unless you are absolutely certain no matches can be found.

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
