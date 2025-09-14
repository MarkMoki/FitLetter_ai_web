
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
  const { user } = await requireAuth();
  if (user.id !== userId) {
    return { error: 'Unauthorized access' };
  }

  try {
    const { data, error } = await db
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return handleError(error, 'Failed to fetch resumes.');

    const parsedResumes = (data || []).map((r: any) => {
      try {
        return {
          id: r.id,
          title: r.title,
          name: r.name,
          phone: r.phone,
          email: r.email,
          linkedinUrl: r.linkedin_url,
          portfolioUrl: r.portfolio_url,
          summary: r.summary,
          skills: typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills,
          experiences: typeof r.experiences === 'string' ? JSON.parse(r.experiences) : r.experiences,
          projects: typeof r.projects === 'string' ? JSON.parse(r.projects) : r.projects,
          education: typeof r.education === 'string' ? JSON.parse(r.education) : r.education,
          userId: r.user_id,
          createdAt: new Date((r.created_at as number) * 1000),
          updatedAt: r.updated_at ? new Date((r.updated_at as number) * 1000) : null,
        };
      } catch (e) {
        console.error('Failed to parse resume data', e);
        return {
          id: r.id,
          title: r.title,
          name: r.name,
          phone: r.phone,
          email: r.email,
          linkedinUrl: r.linkedin_url,
          portfolioUrl: r.portfolio_url,
          summary: r.summary,
          skills: [],
          experiences: [],
          projects: [],
          education: [],
          userId: r.user_id,
          createdAt: new Date((r.created_at as number) * 1000),
          updatedAt: r.updated_at ? new Date((r.updated_at as number) * 1000) : null,
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
  userId,
}: {
  jobTitle: string;
  company: string;
  jobDesc: string;
  content: string;
  tone: string;
  atsScore: number;
  resumeId: number;
  userId?: number;
}) {
  const { user } = await requireAuth();

  try {
    const { data, error } = await db
      .from('letters')
      .insert({
        job_title: jobTitle,
        company,
        job_desc: jobDesc,
        content,
        tone,
        ats_score: atsScore,
        user_id: user.id,
        resume_id: resumeId,
      })
      .select('*')
      .single();

    if (error) return handleError(error, 'Failed to save cover letter.');

    revalidatePath('/dashboard');
    const mapped = data && {
      id: data.id,
      jobTitle: data.job_title,
      company: data.company,
      jobDesc: data.job_desc,
      content: data.content,
      tone: data.tone,
      atsScore: data.ats_score,
      userId: data.user_id,
      resumeId: data.resume_id,
      createdAt: new Date((data.created_at as number) * 1000),
    };
    return { data: mapped as any };
  } catch (error) {
    return handleError(error, 'Failed to save cover letter.');
  }
}

export async function getApplicationsForUser(userId: number) {
  const { user } = await requireAuth();
  if (user.id !== userId) {
    return { error: 'Unauthorized access' };
  }

  try {
    const { data, error } = await db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return handleError(error, 'Failed to fetch applications');

    const mapped = (data || []).map((a: any) => ({
      id: a.id,
      jobTitle: a.job_title,
      company: a.company,
      status: a.status,
      url: a.url,
      requirements: a.requirements,
      deadline: a.deadline ?? null,
      userId: a.user_id,
      createdAt: a.created_at as number,
    }));

    return { data: mapped as any };
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
  userId?: number;
}) {
  const { user } = await requireAuth();

  try {
    const { data, error } = await db
      .from('applications')
      .insert({
        job_title: application.jobTitle,
        company: application.company,
        status: application.status,
        url: application.url,
        requirements: application.requirements,
        user_id: user.id,
      })
      .select('*')
      .single();

    if (error) return handleError(error, 'Failed to add application');

    revalidatePath('/applications');
    revalidatePath('/dashboard');
    const mapped = data && ({
      id: data.id,
      jobTitle: data.job_title,
      company: data.company,
      status: data.status,
      url: data.url,
      requirements: data.requirements,
      deadline: data.deadline ?? null,
      userId: data.user_id,
      createdAt: data.created_at as number,
    });
    return { data: mapped as any };
  } catch(error) {
    return handleError(error, 'Failed to add application');
  }
}

export async function updateApplicationStatus(id: number, status: string) {
  const { user } = await requireAuth();

  try {
    const { error } = await db
      .from('applications')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return handleError(error, 'Failed to update application status');

    revalidatePath('/applications');
    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch (error) {
    return handleError(error, 'Failed to update application status');
  }
}

export async function parseResumeAndSave(input: ParseResumeInput & { title: string; userId?: number }) {
  const { user } = await requireAuth();

  try {
    const parsedData = await parseResume(input);

    const { data, error } = await db
      .from('resumes')
      .insert({
        user_id: user.id,
        title: input.title,
        name: parsedData.name,
        phone: parsedData.phone,
        email: parsedData.email,
        linkedin_url: parsedData.linkedinUrl,
        portfolio_url: parsedData.portfolioUrl,
        summary: parsedData.summary,
        skills: JSON.stringify(parsedData.skills),
        experiences: JSON.stringify(parsedData.experiences),
        projects: JSON.stringify(parsedData.projects),
        education: JSON.stringify(parsedData.education),
      })
      .select('*')
      .single();

    if (error) return handleError(error, 'Failed to parse and save resume.');

    revalidatePath('/resumes');
    const mapped = data && ({
      id: data.id,
      title: data.title,
      name: data.name,
      phone: data.phone,
      email: data.email,
      linkedinUrl: data.linkedin_url,
      portfolioUrl: data.portfolio_url,
      summary: data.summary,
      skills: data.skills,
      experiences: data.experiences,
      projects: data.projects,
      education: data.education,
      userId: data.user_id,
      createdAt: data.created_at as number,
      updatedAt: data.updated_at ?? null,
    });
    return { data: mapped as any };
  } catch (error) {
    return handleError(error, 'Failed to parse and save resume.');
  }
}

export async function deleteResume(id: number) {
  const { user } = await requireAuth();

  try {
    const { error } = await db
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return handleError(error, 'Failed to delete resume.');

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
    const { error } = await db
      .from('letters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return handleError(error, 'Failed to delete letter.');

    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch(e) {
    return handleError(e, 'Failed to delete letter.')
  }
}

export async function deleteUserAccount() {
  const { user } = await requireAuth();

  try {
    await db.from('letters').delete().eq('user_id', user.id);
    await db.from('applications').delete().eq('user_id', user.id);
    await db.from('resumes').delete().eq('user_id', user.id);
    await db.from('users').delete().eq('id', user.id);

    revalidatePath('/');
    return { data: { success: true } };
  } catch(e) {
    return handleError(e, 'Failed to delete account.');
  }
}

export async function getLettersForUser(userId: number) {
  const { user } = await requireAuth();
  if (user.id !== userId) {
    return { error: 'Unauthorized access' };
  }

  try {
    const { data, error } = await db
      .from('letters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return handleError(error, 'Failed to fetch letters.');

    const parsedLetters = (data || []).map((l: any) => ({
      id: l.id,
      jobTitle: l.job_title,
      company: l.company,
      jobDesc: l.job_desc,
      content: l.content,
      tone: l.tone,
      atsScore: l.ats_score,
      userId: l.user_id,
      resumeId: l.resume_id,
      createdAt: new Date((l.created_at as number) * 1000),
    }));

    return { data: parsedLetters };
  } catch (error) {
    return handleError(error, 'Failed to fetch letters.');
  }
}

export async function deleteApplication(id: number) {
  const { user } = await requireAuth();

  try {
    const { error } = await db
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return handleError(error, 'Failed to delete application.');

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
    const { error } = await db
      .from('resumes')
      .update({
        title: resume.title,
        name: resume.name,
        phone: resume.phone,
        email: resume.email,
        linkedin_url: resume.linkedinUrl,
        portfolio_url: resume.portfolioUrl,
        summary: resume.summary,
        skills: typeof resume.skills === 'string' ? resume.skills : JSON.stringify(resume.skills),
        experiences: typeof resume.experiences === 'string' ? resume.experiences : JSON.stringify(resume.experiences),
        projects: typeof resume.projects === 'string' ? resume.projects : JSON.stringify(resume.projects),
        education: typeof resume.education === 'string' ? resume.education : JSON.stringify(resume.education),
        updated_at: Math.floor(Date.now() / 1000),
      })
      .eq('id', resume.id)
      .eq('user_id', user.id);

    if (error) return handleError(error, 'Failed to update resume.');

    revalidatePath('/resumes');
    revalidatePath('/dashboard');
    return { data: { success: true } };
  } catch(e) {
    return handleError(e, 'Failed to update resume.');
  }
}
