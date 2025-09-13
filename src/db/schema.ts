
import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const resumes = sqliteTable("resumes", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  // Header
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  // Sections
  summary: text("summary").notNull(),
  skills: text("skills").notNull(), // Stored as stringified JSON: { programming: [], backendAndCloud: [], mobileAndFrontend: [], databases: [], testingAndCiCd: [] }
  experiences: text("experiences").notNull(), // Stored as stringified JSON
  projects: text("projects").notNull(), // Stored as stringified JSON
  education: text("education").notNull(), // Stored as stringified JSON
  // Foreign Key
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const letters = sqliteTable("letters", {
  id: integer("id").primaryKey(),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  jobDesc: text("job_desc").notNull(),
  content: text("content").notNull(),
  tone: text("tone").notNull(),
  atsScore: integer("ats_score"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  resumeId: integer("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey(),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  status: text("status").notNull().default('Saved'), // e.g., Saved, Applied, Interviewing, Offer, Rejected
  url: text("url"),
  requirements: text("requirements"),
  deadline: integer("deadline", { mode: "timestamp" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

export type Letter = typeof letters.$inferSelect;
export type NewLetter = typeof letters.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Suggestion = {
    originalText: string;
    suggestionText: string;
    comment: string;
}

export type ResumeFlawSpotterOutput = {
    overallFeedback: string;
    suggestions: Suggestion[];
};
