
import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

async function main() {
  try {
    console.log("Seeding database...");
    
    // Check if the user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "demo@fitletter.app"),
    });

    if (existingUser) {
      console.log("✅ Demo user already exists. Seeding not required.");
      return;
    }
    
    console.log("Demo user not found, creating new seed data...");

    // Create a default user for the demo sign-in
    const [user] = await db
      .insert(schema.users)
      .values({
        email: "demo@fitletter.app",
        name: "Demo User",
      })
      .returning();

    // Create a demo resume for the default user
    const [resume] = await db
      .insert(schema.resumes)
      .values({
        userId: user.id,
        title: "App Developer Resume",
        name: "Demo User",
        phone: "123-456-7890",
        email: "demo@fitletter.app",
        linkedinUrl: "https://linkedin.com/in/demouser",
        portfolioUrl: "https://github.com/demouser",
        summary: "Software Engineer with 4+ years of experience building scalable backend systems and APIs. Skilled in databases, cloud integration, and cross-platform apps. Eager to apply technical expertise and collaborative mindset to accelerate AI innovation.",
        skills: JSON.stringify({
          programming: ["Kotlin", "Swift", "Dart", "Java", "JavaScript"],
          backendAndCloud: ["Node.js", "AWS", "Firebase", "Docker"],
          mobileAndFrontend: ["Flutter", "React Native", "Jetpack Compose"],
          databases: ["PostgreSQL", "MongoDB"],
          testingAndCiCd: ["Jest", "XCTest", "Espresso", "Jenkins"],
        }),
        experiences: JSON.stringify([
          {
            role: "Senior App Developer",
            company: "Innovatech Solutions",
            dates: "Jan 2021 - Present",
            impact: [
              "Engineered and launched a Flutter-based e-commerce app, generating 50k+ downloads within 6 months.",
              "Reduced app crash rate by 20% by implementing automated testing with XCTest and Espresso.",
              "Collaborated with a team of 3 to migrate a legacy Android app to Kotlin, cutting technical debt by 30%."
            ]
          },
        ]),
        projects: JSON.stringify([
            {
                title: "SmartBudget (Flutter + Firebase)",
                techUsed: "Flutter, Firebase, Provider",
                description: "Built a personal finance app with authentication, real-time sync, and custom analytics dashboards.",
                impact: "Reached 5k+ monthly active users.",
            },
            {
                title: "AI Expense Classifier",
                techUsed: "TensorFlow Lite, OpenAI API",
                description: "Built a personal project leveraging TensorFlow Lite to classify expenses from text inputs, demonstrating foundational experience in AI-driven applications.",
                impact: "Achieved 92% classification accuracy on test data.",
            }
        ]),
        education: JSON.stringify([
          { degree: "B.S. in Computer Science", school: "University of Technology", year: "2020" },
        ]),
      })
      .returning();

    // Create a demo cover letter for the default user
    await db.insert(schema.letters).values({
      userId: user.id,
      resumeId: resume.id,
      jobTitle: "Exceptional Junior SWE",
      company: "Mercor",
      jobDesc: "We are seeking an exceptional Junior Software Engineer to help us advance AI research.",
      content: "Dear Mercor Hiring Team,\n\nI am excited to apply for the Exceptional Junior SWE position at Mercor. With 4+ years of experience developing scalable backend systems and cross-platform applications, I bring a strong foundation in building performant software and am eager to apply these skills to advance AI-driven innovation.\n\nAt Innovatech Solutions, I launched a Flutter-based e-commerce app that scaled to 50k+ downloads and reduced crash rates by 20% through automated testing. I also optimized PostgreSQL performance for high-traffic environments and collaborated on migrating a legacy Android app to Kotlin, cutting technical debt by 30%. These experiences strengthened my skills in APIs, databases, and secure system design.\n\nMy project SmartBudget, a finance app with 5k+ monthly active users, further highlights my ability to deliver scalable real-time solutions. Additionally, I recently explored TensorFlow Lite in a side project to experiment with expense prediction models, reflecting my curiosity in applying AI to practical use cases.\n\nI am inspired by Mercor’s mission to accelerate AI research and would welcome the opportunity to contribute my technical expertise and growth mindset to your team. Thank you for your time and consideration.\n\nSincerely,\nDemo User",
      tone: "Formal",
      atsScore: 92,
    });

    // Create demo applications for the tracker for the default user
    await db.insert(schema.applications).values([
      {
        userId: user.id,
        jobTitle: "Backend Engineer",
        company: "Innovate Inc.",
        status: "Applied",
        url: "https://example.com/job/123"
      },
      {
        userId: user.id,
        jobTitle: "Full-Stack Developer",
        company: "Solutions Co.",
        status: "Interviewing",
        url: "https://example.com/job/456"
      },
      {
        userId: user.id,
        jobTitle: "DevOps Engineer",
        company: "CloudCore",
        status: "Saved",
        url: "https://example.com/job/789"
      }
    ])

    console.log("✅ Seed data created.");
  } catch (e) {
    console.error("Error: Seeding failed:", e);
    process.exit(1);
  }
}

main();
