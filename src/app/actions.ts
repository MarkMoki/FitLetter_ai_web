
'use server';

import {
  optimizeResumeForAts,
  OptimizeResumeForAtsInput,
  OptimizeResumeForAtsOutput,
} from '@/ai/flows/ats-resume-optimization';
import {
  rewriteForImpact,
  RewriteForImpactInput,
} from '@/ai/flows/impactful-rewrite';
import {
  resumeFlawSpotter,
  ResumeFlawSpotterInput,
} from '@/ai/flows/resume-flaw-spotter';
import {
  tailoredCoverLetter,
  TailoredCoverLetterInput,
  TailoredCoverLetterOutput,
} from '@/ai/flows/tailored-cover-letter';
import { parseResume, ParseResumeInput, ParseResumeOutput } from '@/ai/flows/parse-resume';
import { autofillJobDetails, AutofillJobDetailsInput, AutofillJobDetailsOutput } from '@/ai/flows/autofill-job-details';
import { db } from '@/db';
import {
  letters as lettersTable,
  resumes as resumesTable,
  users,
  applications as applicationsTable,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';

const handleError = (error: unknown, defaultMessage: string) => {
  console.error(error);
  if (error instanceof Error) {
    return { error: error.message };
  }
  return { error: defaultMessage };
};

export async function generateAtsOptimizedResume(
  input: OptimizeResumeForAtsInput
): Promise<{ data: OptimizeResumeForAtsOutput | null; error?: string }> {
  try {
    const result = await optimizeResumeForAts(input);
    return { data: result };
  } catch (error) {
    return handleError(error, 'Failed to optimize resume for ATS.');
  }
}

export async function generateTailoredCoverLetter(
  input: TailoredCoverLetterInput
): Promise<{ data: TailoredCoverLetterOutput | null; error?: string }> {
  try {
    const result = await tailoredCoverLetter(input);
    return { data: result };
  } catch (error) {
    return handleError(error, 'Failed to generate cover letter.');
  }
}

export async function generateImpactfulRewrite(input: RewriteForImpactInput) {
  try {
    const result = await rewriteForImpact(input);
    return { data: result };
  } catch (error) {
    return handleError(error, 'Failed to rewrite resume section.');
  }
}

export async function findResumeFlaws(input: ResumeFlawSpotterInput) {
  try {
    const result = await resumeFlawSpotter(input);
    return { data: result };
  } catch (error) {
    return handleError(error, 'Failed to spot resume flaws.');
  }
}

export async function getResumesForUser(userId: number) {
  // Verify the current user can access this data
  const { user } = await requireAuth();
  if (user.id !== userId) {
    return { error: 'Unauthorized access' };
  }

  try {
    const resumeRecords = await db.query.resumes.findMany({
      where: eq(resumesTable.userId, userId),
      orderBy: (resumes, { desc }) => [desc(resumes.createdAt)],
    });

    const parsedResumes = resumeRecords.map((r) => {
      try {
        return {
          ...r,
          createdAt: new Date(r.createdAt! * 1000),
          updatedAt: r.updatedAt ? new Date(r.updatedAt * 1000) : null,
          experiences: JSON.parse(r.experiences),
          education: JSON.parse(r.education),
          skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills,
          projects: JSON.parse(r.projects),
        };
      } catch (e) {
        console.error('Failed to parse resume data', e);
        return {
          ...r,
          experiences: [],
          education: [],
          skills: [],
          projects: [],
          createdAt: new Date(r.createdAt! * 1000),
          updatedAt: r.updatedAt ? new Date(r.updatedAt * 1000) : null,
        };
      }
    });

    return { data: parsedResumes };
  } catch (error) {
    return handleError(error, 'Failed to fetch resumes.');
  }
}

export async function saveLetter({
  jobTitle,
  company,
  jobDesc,
  content,
  tone,
  atsScore,
  resumeId,
  userId
}: {
  jobTitle: string;
  company: string;
  jobDesc: string;
  content: string;
  tone: string;
  atsScore: number;
  resumeId: number;
}) {
  const { user } = await requireAuth();

  try {
    const [savedLetter] = await db
      .insert(lettersTable)
      .values({
        jobTitle,
        company,
        jobDesc,
        content,
        tone,
        atsScore,
        userId: user.id,
        resumeId,
      })
      .returning();

    revalidatePath('/dashboard');
    return { data: savedLetter };
  } catch (error) {
    return handleError(error, 'Failed to save cover letter.');
  }
}

export async function getApplicationsForUser(userId: number) {
  // Verify the current user can access this data
  const { user } = await requireAuth();
  if (user.id !== userId) {
    return { error: 'Unauthorized access' };
  }

  try {
    const applications = await db.query.applications.findMany({
      where: eq(applicationsTable.userId, userId),
      orderBy: (applications, { desc }) => [desc(applications.createdAt)],
    });
    
    return { data: applications };

  } catch (error) {
    return handleError(error, 'Failed to fetch applications');
  }
}

export async function addApplication(application: {
  jobTitle: string;
  company: string;
  status: string;
  url?: string;
  requirements?: string;
}) {
  const { user } = await requireAuth();

  try {
    const [newApplication] = await db.insert(applicationsTable).values({
      ...application,
      userId: user.id,
    }).returning();
    revalidatePath('/applications');
    revalidatePath('/dashboard');
    return {data: newApplication};

  } catch(error) {
    return handleError(error, 'Failed to add application');
  }
}

export async function updateApplicationStatus(id: number, status: string) {
  const { user } = await requireAuth();

   try {
    // Ensure user can only update their own applications
    await db.update(applicationsTable)
      .set({ status })
      .where(
        and(
          eq(applicationsTable.id, id),
          eq(applicationsTable.userId, user.id)
        )
      );
    revalidatePath('/applications');
    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch (error) {
    return handleError(error, 'Failed to update application status');
  }
}

export async function parseResumeAndSave(input: ParseResumeInput & { title: string }) {
    const { user } = await requireAuth();

    try {
        const parsedData = await parseResume(input);

        const [newResume] = await db.insert(resumesTable).values({
            userId: user.id,
            title: input.title,
            name: parsedData.name,
            phone: parsedData.phone,
            email: parsedData.email,
            linkedinUrl: parsedData.linkedinUrl,
            portfolioUrl: parsedData.portfolioUrl,
            summary: parsedData.summary,
            skills: JSON.stringify(parsedData.skills),
            experiences: JSON.stringify(parsedData.experiences),
            projects: JSON.stringify(parsedData.projects),
            education: JSON.stringify(parsedData.education),
        }).returning();
        revalidatePath('/resumes');
        return { data: newResume };
    } catch (error) {
        return handleError(error, 'Failed to parse and save resume.');
    }
}

export async function deleteResume(id: number) {
  const { user } = await requireAuth();

  try {
    // Ensure user can only delete their own resumes
    await db.delete(resumesTable).where(
      and(
        eq(resumesTable.id, id),
        eq(resumesTable.userId, user.id)
      )
    );
    revalidatePath('/resumes');
    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch(e) {
    return handleError(e, 'Failed to delete resume.')
  }
}


export async function deleteLetter(id: number) {
  const { user } = await requireAuth();

  try {
    // Ensure user can only delete their own letters
    await db.delete(lettersTable).where(
      and(
        eq(lettersTable.id, id),
        eq(lettersTable.userId, user.id)
      )
    );
    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch(e) {
    return handleError(e, 'Failed to delete letter.')
  }
}

export async function deleteUserAccount() {
  const { user } = await requireAuth();

  try {
    // Delete all associated data, respecting foreign key constraints
    await db.delete(lettersTable).where(eq(lettersTable.userId, user.id));
    await db.delete(applicationsTable).where(eq(applicationsTable.userId, user.id));
    await db.delete(resumesTable).where(eq(resumesTable.userId, user.id));
    
    // Finally, delete the user
    await db.delete(users).where(eq(users.id, user.id));

    revalidatePath('/');
    return { data: { success: true } };

  } catch(e) {
    return handleError(e, 'Failed to delete account.');
  }
}

export async function getLettersForUser(userId: number) {
  // Verify the current user can access this data
  const { user } = await requireAuth();
  if (user.id !== userId) {
    return { error: 'Unauthorized access' };
  }

  try {
    const letterRecords = await db.query.letters.findMany({
      where: eq(lettersTable.userId, userId),
      orderBy: (letters, { desc }) => [desc(letters.createdAt)],
    });

    const parsedLetters = letterRecords.map((l) => ({
      ...l,
      createdAt: new Date(l.createdAt! * 1000)
    }))

    return { data: parsedLetters };
  } catch (error) {
    return handleError(error, 'Failed to fetch letters.');
  }
}

export async function deleteApplication(id: number) {
  const { user } = await requireAuth();

  try {
    // Ensure user can only delete their own applications
    await db.delete(applicationsTable).where(
      and(
        eq(applicationsTable.id, id),
        eq(applicationsTable.userId, user.id)
      )
    );
    revalidatePath('/applications');
    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch (e) {
    return handleError(e, 'Failed to delete application.');
  }
}


export async function autofillJobDetailsAction(input: AutofillJobDetailsInput): Promise<{data: AutofillJobDetailsOutput | null; error?: string}> {
    try {
        const result = await autofillJobDetails(input);
        return { data: result };
    } catch(e) {
        return handleError(e, 'Failed to autofill job details.');
    }
}

export async function updateResume(resume: ParseResumeOutput & { id: number, title: string }) {
    const { user } = await requireAuth();

    try {
        await db.update(resumesTable)
          .set({
            title: resume.title,
            name: resume.name,
            phone: resume.phone,
            email: resume.email,
            linkedinUrl: resume.linkedinUrl,
            portfolioUrl: resume.portfolioUrl,
            summary: resume.summary,
            skills: typeof resume.skills === 'string' ? resume.skills : JSON.stringify(resume.skills),
            experiences: typeof resume.experiences === 'string' ? resume.experiences : JSON.stringify(resume.experiences),
            projects: typeof resume.projects === 'string' ? resume.projects : JSON.stringify(resume.projects),
            education: typeof resume.education === 'string' ? resume.education : JSON.stringify(resume.education),
            updatedAt: sql`(strftime('%s', 'now'))`,
          })
          .where(
            and(
              eq(resumesTable.id, resume.id),
              eq(resumesTable.userId, user.id)
            )
          );
        revalidatePath('/resumes');
        revalidatePath('/dashboard');
        return { data: { success: true } };
    } catch(e) {
        return handleError(e, 'Failed to update resume.');
    }
}
