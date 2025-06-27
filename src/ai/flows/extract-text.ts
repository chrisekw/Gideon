'use server';
/**
 * @fileOverview An AI agent for extracting and processing text from images.
 *
 * - extractText - A function that extracts text from an image and performs a task on it.
 * - ExtractTextInput - The input type for the extractText function.
 * - ExtractTextOutput - The return type for the extractText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document or text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  task: z.string().describe('The task to perform on the text. For example: "extract", "summarize", or a question about the text. If empty, just extract the text.'),
});
export type ExtractTextInput = z.infer<typeof ExtractTextInputSchema>;

const ExtractTextOutputSchema = z.object({
  result: z.string().describe('The result of the text processing task.'),
});
export type ExtractTextOutput = z.infer<typeof ExtractTextOutputSchema>;

export async function extractText(input: ExtractTextInput): Promise<ExtractTextOutput> {
  return extractTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTextPrompt',
  input: {schema: ExtractTextInputSchema},
  output: {schema: ExtractTextOutputSchema},
  prompt: `You are an AI assistant that is an expert at processing text from images. First, carefully read and extract all the text from the image.
Then, perform the following task on the extracted text: {{{task}}}
If the task is empty or just says "extract", simply return the extracted text.
Present only the final result of the task.

Image: {{media url=photoDataUri}}`,
});

const extractTextFlow = ai.defineFlow(
  {
    name: 'extractTextFlow',
    inputSchema: ExtractTextInputSchema,
    outputSchema: ExtractTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
