
'use server';
/**
 * @fileOverview An AI agent that parses job posting text into a structured format.
 *
 * - autofillJobDetails - A function that handles the job detail parsing process.
 * - AutofillJobDetailsInput - The input type for the autofillJobDetails function.
 * - AutofillJobDetailsOutput - The return type for the autofillJobDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutofillJobDetailsInputSchema = z.object({
  jobPostingText: z.string().describe('The raw text content of the job posting to be parsed.'),
});
export type AutofillJobDetailsInput = z.infer<typeof AutofillJobDetailsInputSchema>;

const AutofillJobDetailsOutputSchema = z.object({
  jobTitle: z.string().describe('The job title. Leave empty if not found.'),
  companyName: z.string().describe('The name of the company. Leave empty if not found.'),
  jobDescription: z.string().describe('The full job description, cleaned up from the raw text. Leave empty if not found.'),
  requirements: z.string().optional().describe('A concise, bulleted list of the key requirements, skills, or qualifications from the job description. If none are listed, leave this empty.'),
  url: z.string().optional().describe('The URL to the job posting, if present.')
});
export type AutofillJobDetailsOutput = z.infer<typeof AutofillJobDetailsOutputSchema>;

export async function autofillJobDetails(input: AutofillJobDetailsInput): Promise<AutofillJobDetailsOutput> {
  return autofillJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autofillJobDetailsPrompt',
  input: {schema: AutofillJobDetailsInputSchema},
  output: {schema: AutofillJobDetailsOutputSchema},
  prompt: `You are an expert data extractor for job postings. Your task is to analyze the provided text and pull out key details into a structured format.

Your instructions are:
1.  **Extract Key Information**: From the text below, identify the Job Title, Company Name, and the full Job Description.
2.  **Summarize Requirements**: From the full job description, create a concise, bulleted list of the most important requirements, skills, or qualifications. Place this in the 'requirements' field.
3.  **Find URL**: If a URL to the job posting is present in the text, extract it.
4.  **Clean Description**: Tidy up the job description to be a readable block of text, removing any formatting artifacts.
5.  **Handle Missing Info**: If you cannot find a specific piece of information (e.g., no requirements listed), leave the corresponding field in the JSON output as an empty string.

Job Posting Text:
{{{jobPostingText}}}`,
});

const autofillJobDetailsFlow = ai.defineFlow(
  {
    name: 'autofillJobDetailsFlow',
    inputSchema: AutofillJobDetailsInputSchema,
    outputSchema: AutofillJobDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
