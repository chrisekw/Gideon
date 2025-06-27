'use server';
/**
 * @fileOverview An AI agent for solving homework problems.
 *
 * - solveHomework - A function that provides step-by-step solutions to homework problems from an image.
 * - SolveHomeworkInput - The input type for the solveHomework function.
 * - SolveHomeworkOutput - The return type for the solveHomework function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SolveHomeworkInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a homework problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SolveHomeworkInput = z.infer<typeof SolveHomeworkInputSchema>;

const SolveHomeworkOutputSchema = z.object({
  solution: z.string().describe('A step-by-step solution to the problem, including explanations for each step.'),
});
export type SolveHomeworkOutput = z.infer<typeof SolveHomeworkOutputSchema>;

export async function solveHomework(input: SolveHomeworkInput): Promise<SolveHomeworkOutput> {
  return solveHomeworkFlow(input);
}

const prompt = ai.definePrompt({
  name: 'solveHomeworkPrompt',
  input: {schema: SolveHomeworkInputSchema},
  output: {schema: SolveHomeworkOutputSchema},
  prompt: `You are an expert tutor specializing in math and science. Analyze the image of the homework problem provided and give a clear, step-by-step solution. Explain the steps simply, as if you were teaching a student.

Image: {{media url=photoDataUri}}`,
});

const solveHomeworkFlow = ai.defineFlow(
  {
    name: 'solveHomeworkFlow',
    inputSchema: SolveHomeworkInputSchema,
    outputSchema: SolveHomeworkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
