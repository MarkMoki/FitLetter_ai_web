// Types only schema for Supabase-backed app
// This replaces Drizzle ORM sqliteTable definitions.

export type User = {
  id: number;
  name: string | null;
  email: string;
  passwordHash?: string | null; // mapped from password_hash
  createdAt?: number | Date; // epoch seconds or Date (normalized by callers)
};

export type NewUser = {
  name?: string | null;
  email: string;
  passwordHash?: string | null;
};

export type Session = {
  id: string;
  userId: number; // mapped from user_id
  expiresAt: number | Date; // epoch seconds or Date (normalized by callers)
  createdAt?: number | Date;
};

export type NewSession = {
  id: string;
  userId: number;
  expiresAt: number;
};

export type Resume = {
  id: number;
  title: string;
  // Header
  name: string;
  phone: string;
  email: string;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  // Sections
  summary: string;
  skills: any; // stringified JSON or parsed object depending on usage
  experiences: any;
  projects: any;
  education: any;
  // Foreign Key
  userId: number; // mapped from user_id
  createdAt?: number | Date;
  updatedAt?: number | Date | null;
};

export type NewResume = Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>;

export type Letter = {
  id: number;
  jobTitle: string; // job_title
  company: string;
  jobDesc: string; // job_desc
  content: string;
  tone: string;
  atsScore?: number | null; // ats_score
  userId: number; // user_id
  resumeId: number; // resume_id
  createdAt?: number | Date;
};

export type NewLetter = Omit<Letter, 'id' | 'createdAt'>;

export type Application = {
  id: number;
  jobTitle: string; // job_title
  company: string;
  status: string;
  url?: string | null;
  requirements?: string | null;
  deadline?: number | Date | null;
  userId: number; // user_id
  createdAt?: number | Date;
};

export type NewApplication = Omit<Application, 'id' | 'createdAt'>;

export type Suggestion = {
  originalText: string;
  suggestionText: string;
  comment: string;
}

export type ResumeFlawSpotterOutput = {
  overallFeedback: string;
  suggestions: Suggestion[];
};
