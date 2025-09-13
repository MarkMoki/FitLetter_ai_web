
'use server';
/**
 * @fileOverview An AI agent that parses resume text into a structured format.
 *
 * - parseResume - A function that handles the resume parsing process.
 * - ParseResumeInput - The input type for the parseResume function.
 * - ParseResumeOutput - The return type for the parseResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeInputSchema = z.object({
  resumeText: z.string().describe('The raw text content of the resume to be parsed.'),
});
export type ParseResumeInput = z.infer<typeof ParseResumeInputSchema>;

const ExperienceSchema = z.object({
    role: z.string().describe('The job title or role.'),
    company: z.string().describe('The name of the company.'),
    dates: z.string().describe("The dates of employment (e.g., 'Jan 2021 - Present')."),
    impact: z.array(z.string()).describe('A list of 3-5 bullet points. Each bullet must start with an action verb and describe a key achievement with quantifiable impact (e.g., "Reduced app crash rate by 20%...").'),
});

const ProjectSchema = z.object({
    title: z.string().describe("The title of the project."),
    techUsed: z.string().describe("The technologies used in the project."),
    description: z.string().describe("A brief description of what you built for the project."),
    impact: z.string().describe("The result or impact of the project. This is a required field. If a project is fictional, create a realistic impact statement."),
});

const EducationSchema = z.object({
    degree: z.string().describe('The degree or qualification obtained.'),
    school: z.string().describe('The name of the educational institution.'),
    year: z.string().describe('The year of graduation or completion.'),
});

const SkillsSchema = z.array(z.string()).describe("A flat list of key technical skills. Do not categorize them. Trim any redundancies.");


const ParseResumeOutputSchema = z.object({
  name: z.string().describe("The candidate's full name."),
  phone: z.string().describe("The candidate's phone number."),
  email: z.string().describe("The candidate's email address."),
  linkedinUrl: z.string().optional().describe("The URL to the candidate's LinkedIn profile."),
  portfolioUrl: z.string().optional().describe("The URL to the candidate's GitHub or portfolio."),
  summary: z.string().describe('A 2-3 sentence professional summary. Reframe >3 years of experience to be about adaptability. Add a "seeking statement" that mirrors a target role (e.g., "Eager to apply technical expertise to accelerate AI innovation.").'),
  skills: SkillsSchema,
  experiences: z.array(ExperienceSchema).describe('A list of professional experiences.'),
  projects: z.array(ProjectSchema).describe("A list of key projects. If the candidate has no AI-related projects, add a fictional one about a simple AI experiment using TensorFlow Lite, Hugging Face, or an OpenAI API to demonstrate curiosity in AI. Ensure that every project, including fictional ones, has a defined 'impact' statement."),
  education: z.array(EducationSchema).describe('A list of educational qualifications.'),
});
export type ParseResumeOutput = z.infer<typeof ParseResumeOutputSchema>;

export async function parseResume(input: ParseResumeInput): Promise<ParseResumeOutput> {
  return parseResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumePrompt',
  input: {schema: ParseResumeInputSchema},
  output: {schema: ParseResumeOutputSchema},
  prompt: `You are an expert resume parser for App Developers. Analyze the provided resume text and extract the information into the specified structured JSON format. You must follow all the rules defined in the output schema.

**Skills Formatting Rule**: Provide a flat array of skills. Do not categorize them into buckets like "programming", "backend", etc.

Resume Text:
{{resumeText}}`,
});

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: ParseResumeInputSchema,
    outputSchema: ParseResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
