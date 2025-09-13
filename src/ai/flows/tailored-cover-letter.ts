
'use server';

/**
 * @fileOverview Generates a cover letter tailored to a specific job description.
 *
 * - tailoredCoverLetter - A function that generates a cover letter based on a job description.
 * - TailoredCoverLetterInput - The input type for the tailoredCoverLetter function.
 * - TailoredCoverLetterOutput - The return type for the tailoredCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TailoredCoverLetterInputSchema = z.object({
  resume: z.string().describe('The user resume, which includes their skills, experience, and projects.'),
  jobTitle: z.string().describe('The job title for the cover letter.'),
  company: z.string().describe('The company name for the cover letter.'),
  jobDescription: z.string().describe('The job description to tailor the cover letter to.'),
  tone: z.string().describe('The tone of the cover letter (e.g., Friendly, Formal, Enthusiastic).'),
  currentCoverLetter: z.string().optional().describe('An existing cover letter to be improved upon.'),
});
export type TailoredCoverLetterInput = z.infer<typeof TailoredCoverLetterInputSchema>;

const TailoredCoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The generated cover letter.'),
});
export type TailoredCoverLetterOutput = z.infer<typeof TailoredCoverLetterOutputSchema>;

export async function tailoredCoverLetter(input: TailoredCoverLetterInput): Promise<TailoredCoverLetterOutput> {
  return tailoredCoverLetterFlow(input);
}

const tailoredCoverLetterPrompt = ai.definePrompt({
  name: 'tailoredCoverLetterPrompt',
  input: {schema: TailoredCoverLetterInputSchema},
  output: {schema: TailoredCoverLetterOutputSchema},
  prompt: `You are an expert cover letter writer for software developers. Your task is to generate a professional, impactful cover letter based on the provided resume and job details.

{{#if currentCoverLetter}}
You have been provided with an existing cover letter. Your task is to refine and improve it for better impact and clarity, while adhering to all the rules below.
Existing Cover Letter:
{{{currentCoverLetter}}}
{{/if}}

Follow these MANDATORY rules for the cover letter structure:
1.  **STRICT 3-PARAGRAPH LIMIT**: The entire cover letter, excluding the opening and closing salutations, MUST consist of exactly three paragraphs.
2.  **Opening Paragraph:** Start by showing excitement for the company and mention the specific job title. Highlight 1-2 key skills from the resume that directly match the job description.
3.  **Body Paragraph:** Provide a specific, quantifiable achievement from the resume (a project or experience) that demonstrates impact. Connect this achievement directly to the needs mentioned in the job description.
4.  **Closing Paragraph:** Reiterate your interest in the role and the company's mission. End with a clear call to action, expressing your eagerness to discuss your qualifications further.
5.  **Professional Tone**: Maintain the requested tone throughout the letter.

**IMPORTANT FORMATTING RULES**:
- Use double line breaks to create paragraphs.
- Ensure the final output is a clean, well-spaced, professional letter.

Resume:
{{{resume}}}

Job Title: {{{jobTitle}}}
Company: {{{company}}}
Job Description: {{{jobDescription}}}
Tone: {{{tone}}}
`,
});

const tailoredCoverLetterFlow = ai.defineFlow(
  {
    name: 'tailoredCoverLetterFlow',
    inputSchema: TailoredCoverLetterInputSchema,
    outputSchema: TailoredCoverLetterOutputSchema,
  },
  async input => {
    const {output} = await tailoredCoverLetterPrompt(input);
    return output!;
  }
);

