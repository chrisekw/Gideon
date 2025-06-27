'use server';
/**
 * @fileOverview An AI agent for solving homework problems, with diagram generation.
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
  diagramUrl: z.string().optional().describe('A URL (data URI) for a generated diagram that helps explain the solution.'),
});
export type SolveHomeworkOutput = z.infer<typeof SolveHomeworkOutputSchema>;

// Intermediate schema for the text-generation part of the flow
const SolutionTextSchema = z.object({
    solution: z.string().describe('A step-by-step solution to the problem, including explanations for each step.'),
    diagramPrompt: z.string().optional().describe('If a diagram is needed, a detailed prompt for an image generation model to create it. For example: "A free-body diagram of a block on an inclined plane."'),
});

export async function solveHomework(input: SolveHomeworkInput): Promise<SolveHomeworkOutput> {
  return solveHomeworkFlow(input);
}

const solutionPrompt = ai.definePrompt({
  name: 'solveHomeworkTextPrompt',
  input: {schema: SolveHomeworkInputSchema},
  output: {schema: SolutionTextSchema},
  prompt: `You are an expert tutor specializing in math and science. Your task is to solve the homework problem in the image.

**Process:**
1.  Analyze the image and understand the problem.
2.  Formulate a clear, step-by-step solution. Explain the logic for each step simply, as if you were teaching a student.
3.  Determine if a diagram would significantly help in understanding the solution (e.g., free-body diagrams, geometric shapes, graphs).
4.  If a diagram is helpful, create a concise but descriptive prompt for an AI image generator to create that diagram. The prompt should describe a clean, simple, educational diagram. For example: "A simple right-angled triangle with sides labeled a, b, and hypotenuse c." or "A free-body diagram showing the forces of gravity, normal force, and friction on a block sliding down an inclined plane."
5.  If no diagram is needed, leave the \`diagramPrompt\` field empty.

Image: {{media url=photoDataUri}}`,
});

const solveHomeworkFlow = ai.defineFlow(
  {
    name: 'solveHomeworkFlow',
    inputSchema: SolveHomeworkInputSchema,
    outputSchema: SolveHomeworkOutputSchema,
  },
  async (input) => {
    // Step 1: Get the text solution and a potential prompt for a diagram
    const { output: solutionResult } = await solutionPrompt(input);
    if (!solutionResult) {
      throw new Error('Failed to generate a solution.');
    }

    let diagramUrl: string | undefined = undefined;

    // Step 2: If a diagram prompt was generated, create the diagram
    if (solutionResult.diagramPrompt) {
      try {
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: `Create a clear, simple, educational diagram for a student. Style: minimalist, black and white, clean lines. Diagram topic: ${solutionResult.diagramPrompt}`,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });
        if (media?.url) {
          diagramUrl = media.url;
        }
      } catch (e) {
        console.error("Diagram generation failed:", e);
        // Continue without a diagram if generation fails
      }
    }

    // Step 3: Combine the solution text with the generated diagram URL
    return {
      solution: solutionResult.solution,
      diagramUrl: diagramUrl,
    };
  }
);
