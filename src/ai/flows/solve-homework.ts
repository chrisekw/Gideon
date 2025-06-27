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

const HomeworkSolutionItemSchema = z.object({
    question: z.string().describe("The specific question identified from the image."),
    solution: z.string().describe("A step-by-step solution to the problem. Each step MUST be on a new line."),
    diagramPrompt: z.string().optional().describe('If a diagram is essential to explain the solution, provide a detailed, descriptive prompt for an AI image generator to create it. For example: "A free-body diagram of a block on an inclined plane." The diagram should be simple, clean, and educational.'),
});

const SolveHomeworkOutputSchema = z.object({
    preamble: z.string().describe("Start with a friendly, encouraging preamble as if you're a brilliant and helpful student. For example: 'Hey! I looked at your homework, and it looks fun! Let's break it down.'"),
    solutions: z.array(z.object({
        question: z.string(),
        solution: z.string(),
        diagramUrl: z.string().optional(),
    })).describe('An array of solutions, one for each question found in the image.'),
});
export type SolveHomeworkOutput = z.infer<typeof SolveHomeworkOutputSchema>;

const SolutionTextSchema = z.object({
    preamble: z.string().describe("Start with a friendly, encouraging preamble as if you're a brilliant and helpful student. For example: 'Hey! I looked at your homework, and it looks fun! Let's break it down.'"),
    solutions: z.array(HomeworkSolutionItemSchema).describe('An array of solutions, one for each question found in the image.'),
});


export async function solveHomework(input: SolveHomeworkInput): Promise<SolveHomeworkOutput> {
  return solveHomeworkFlow(input);
}

const solutionPrompt = ai.definePrompt({
  name: 'solveHomeworkTextPrompt',
  input: {schema: SolveHomeworkInputSchema},
  output: {schema: SolutionTextSchema},
  prompt: `You are an expert tutor, but you have the persona of a brilliant, enthusiastic, and friendly student who loves to help others. Your task is to solve all the math and science problems in the image.

**Your Process:**
1.  **Friendly Greeting**: Start with a fun, encouraging preamble.
2.  **Identify All Questions**: Carefully scan the image and identify every distinct question.
3.  **Solve Step-by-Step**: For each question, provide a clear, step-by-step solution. Explain your thinking for each step in a simple, easy-to-follow way.
4.  **Diagrams are Key**: For each solution, decide if a diagram would make it easier to understand (e.g., geometric shapes, graphs, free-body diagrams). If so, create a concise but descriptive prompt for an AI image generator. The prompt should result in a clean, simple, educational diagram.
5.  **Format Correctly**: Structure your entire response according to the output schema. Make sure each step in the \`solution\` field is on a new line.

Let's make learning awesome!

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
    const { output: structuredResult } = await solutionPrompt(input);
    if (!structuredResult || !structuredResult.solutions) {
      throw new Error('Failed to generate a solution.');
    }

    // Step 2: Generate diagrams for each solution that needs one, in parallel
    const solutionsWithDiagrams = await Promise.all(
      structuredResult.solutions.map(async (solution) => {
        if (!solution.diagramPrompt) {
          return { ...solution, diagramUrl: undefined };
        }
        try {
          const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: `Create a clear, simple, educational diagram for a student. Style: minimalist, black and white, clean lines. Diagram topic: ${solution.diagramPrompt}`,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          });
          // Return solution with the new diagram URL
          return { ...solution, diagramUrl: media?.url };
        } catch (e) {
          console.error("Diagram generation failed:", e);
          // Return solution without a diagram if generation fails
          return { ...solution, diagramUrl: undefined };
        }
      })
    );

    // Step 3: Combine the preamble with the solutions (which now have diagram URLs)
    return {
      preamble: structuredResult.preamble,
      // Remove the temporary diagramPrompt field from the final output
      solutions: solutionsWithDiagrams.map(({ diagramPrompt, ...rest }) => rest),
    };
  }
);
