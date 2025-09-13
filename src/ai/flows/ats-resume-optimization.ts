
'use server';

/**
 * @fileOverview A flow to optimize a resume for Applicant Tracking Systems (ATS).
 *
 * - optimizeResumeForAts - A function that optimizes a resume for ATS.
 * - OptimizeResumeForAtsInput - The input type for the optimizeResumeForAts function.
 * - OptimizeResumeForAtsOutput - The return type for the optimizeResumeForAts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeResumeForAtsInputSchema = z.object({
  resume: z.string().describe('The resume content to be optimized.'),
  jobDescription: z.string().describe('The job description to tailor the resume for.'),
  currentOptimizedResume: z.string().optional().describe('An existing optimized resume to be improved upon.'),
  missingSkills: z.string().optional().describe('The missing skills that can be used to optimize the resume.'),
  currentAtsScore: z.number().optional().describe('The current ATS score of the resume to be improved upon.'),
});
export type OptimizeResumeForAtsInput = z.infer<typeof OptimizeResumeForAtsInputSchema>;

const OptimizeResumeForAtsOutputSchema = z.object({
  optimizedResume: z.string().describe('The optimized resume content for ATS.'),
  atsScore: z.number().describe('The estimated ATS score of the optimized resume.'),
});
export type OptimizeResumeForAtsOutput = z.infer<typeof OptimizeResumeForAtsOutputSchema>;

export async function optimizeResumeForAts(input: OptimizeResumeForAtsInput): Promise<OptimizeResumeForAtsOutput> {
  return optimizeResumeForAtsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeResumeForAtsPrompt',
  input: {schema: OptimizeResumeForAtsInputSchema},
  output: {schema: OptimizeResumeForAtsOutputSchema},
  prompt: `You are an expert resume optimizer specializing in Applicant Tracking Systems (ATS).

  {{#if currentOptimizedResume}}
  Your task is to refine and improve the provided "Already Optimized Resume" to achieve an even higher ATS score and better overall quality. Analyze it against the original resume and the job description, and make it even more impactful and keyword-rich.
  
  **IMPORTANT RULE**: The new "atsScore" you generate MUST be greater than the "currentAtsScore". Do not decrease the score.

  Already Optimized Resume:
  {{{currentOptimizedResume}}}

  Current ATS Score: {{currentAtsScore}}
  {{else}}
  You will analyze the resume and job description to tailor the resume for the role, focusing on improving its ATS score.
  Consider the provided job description and missing skills to identify relevant keywords and phrases to incorporate into the resume.
  {{/if}}

  Original Resume:
  {{resume}}

  Job Description:
  {{jobDescription}}

  Missing Skills (optional):
  {{#if missingSkills}}
  {{missingSkills}}
  {{else}}
  None provided.
  {{/if}}

  Based on the information above, provide an optimized resume and an estimated ATS score (out of 100) for the final optimized resume.

  **IMPORTANT FORMATTING RULES**:
  - The output must be a single block of text.
  - Use double line breaks (\n\n) to separate major sections (e.g., between Summary and Skills).
  - Use single line breaks (\n) for lists or bullet points.
  - Ensure the final output is clean, professional, and easy to read.

  Your output should be in the following format:
  {
    "optimizedResume": "[Fully formatted, optimized resume content here]",
    "atsScore": [Estimated ATS score here]
  }
  `,
});

const optimizeResumeForAtsFlow = ai.defineFlow(
  {
    name: 'optimizeResumeForAtsFlow',
    inputSchema: OptimizeResumeForAtsInputSchema,
    outputSchema: OptimizeResumeForAtsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
