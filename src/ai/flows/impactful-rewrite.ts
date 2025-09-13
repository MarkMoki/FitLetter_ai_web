
'use server';

/**
 * @fileOverview Rewrites resume sections to emphasize impact and achievements.
 *
 * - rewriteForImpact - A function that rewrites the resume sections to emphasize impact and achievements.
 * - RewriteForImpactInput - The input type for the rewriteForImpact function.
 * - RewriteForImpactOutput - The return type for the rewriteForImpact function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RewriteForImpactInputSchema = z.object({
  resumeSection: z.string().describe('The resume section to rewrite.'),
  currentText: z.string().describe('The current text of the resume section.'),
  jobDescription: z.string().optional().describe('The job description to tailor the rewrite for.'),
});
export type RewriteForImpactInput = z.infer<typeof RewriteForImpactInputSchema>;

const RewriteForImpactOutputSchema = z.object({
  rewrittenText: z.string().describe('The rewritten text with emphasized impact and achievements.'),
});
export type RewriteForImpactOutput = z.infer<typeof RewriteForImpactOutputSchema>;

export async function rewriteForImpact(input: RewriteForImpactInput): Promise<RewriteForImpactOutput> {
  return rewriteForImpactFlow(input);
}

const prompt = ai.definePrompt({
  name: 'rewriteForImpactPrompt',
  input: {schema: RewriteForImpactInputSchema},
  output: {schema: RewriteForImpactOutputSchema},
  prompt: `You are an expert resume writer specializing in making content more impactful.

  Rewrite the following resume section to highlight the candidate's achievements.

  Your rewriting rules are:
  1.  Each bullet point must start with a strong action verb (e.g., Engineered, Optimized, Reduced, Automated, Delivered).
  2.  Focus on quantifiable impact. Add metrics wherever possible (e.g., downloads, %, MAUs, response time improvements).
  3.  If the original text mentions leadership, reframe it to highlight collaboration and mentorship, especially for non-senior roles. For example, "led a team" becomes "Collaborated with a team".

  Resume Section: {{{resumeSection}}}
  Current Text: {{{currentText}}}

  {{#if jobDescription}}
  Tailor the rewrite for the following job description:
  {{{jobDescription}}}
  {{/if}}
  `,
});

const rewriteForImpactFlow = ai.defineFlow(
  {
    name: 'rewriteForImpactFlow',
    inputSchema: RewriteForImpactInputSchema,
    outputSchema: RewriteForImpactOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
