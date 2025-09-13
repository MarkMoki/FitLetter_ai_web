// src/ai/flows/resume-flaw-spotter.ts
'use server';
/**
 * @fileOverview An AI agent that identifies flaws in a resume and suggests improvements.
 *
 * - resumeFlawSpotter - A function that handles the resume flaw spotting process.
 * - ResumeFlawSpotterInput - The input type for the resumeFlawSpotter function.
 * - ResumeFlawSpotterOutput - The return type for the resumeFlawSpotter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResumeFlawSpotterInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume to be reviewed.'),
});
export type ResumeFlawSpotterInput = z.infer<typeof ResumeFlawSpotterInputSchema>;

const SuggestionSchema = z.object({
    originalText: z.string().describe("The original text from the resume that has a flaw."),
    suggestionText: z.string().describe("The suggested replacement text."),
    comment: z.string().describe("A brief explanation of why the change is recommended (e.g., 'Adds a quantifiable metric').")
})

const ResumeFlawSpotterOutputSchema = z.object({
  overallFeedback: z.string().describe("A brief, one-sentence summary of the resume's strength."),
  suggestions: z.array(SuggestionSchema).describe("A list of specific, actionable suggestions for improvement. Focus on rewriting bullet points for impact, adding metrics, and improving clarity.")
});
export type ResumeFlawSpotterOutput = z.infer<typeof ResumeFlawSpotterOutputSchema>;

export async function resumeFlawSpotter(input: ResumeFlawSpotterInput): Promise<ResumeFlawSpotterOutput> {
  return resumeFlawSpotterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'resumeFlawSpotterPrompt',
  input: {schema: ResumeFlawSpotterInputSchema},
  output: {schema: ResumeFlawSpotterOutputSchema},
  prompt: `You are an expert resume reviewer for software developers. Your task is to analyze the provided resume text, identify specific areas for improvement, and provide actionable suggestions in a structured format.

Rules for providing suggestions:
1.  **Focus on Impact**: Prioritize suggestions that add quantifiable metrics (e.g., numbers, percentages, user counts) to achievements.
2.  **Action Verbs**: Suggest rewriting sentences to start with strong action verbs (e.g., Engineered, Optimized, Architected).
3.  **Clarity and Brevity**: Offer changes that make the text more concise and easier to read.
4.  **Be Specific**: Each suggestion should target a single, specific line or bullet point. Do not group multiple changes into one suggestion.
5.  **Provide Feedback**: Give a brief, one-sentence summary of the resume's overall quality.

Resume Text to Analyze:
{{resumeText}}`,
});

const resumeFlawSpotterFlow = ai.defineFlow(
  {
    name: 'resumeFlawSpotterFlow',
    inputSchema: ResumeFlawSpotterInputSchema,
    outputSchema: ResumeFlawSpotterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
