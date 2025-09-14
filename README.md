# FitLetter: AI-Powered Resume & Cover Letter Assistant

FitLetter is a full-stack application designed to help job seekers create perfectly tailored resumes and cover letters. By leveraging the power of generative AI, FitLetter analyzes job descriptions, optimizes resumes for Applicant Tracking Systems (ATS), and generates impactful, tone-appropriate application documents.

## ✨ Core Features

-   **Resume Flaw Spotter**: Uses AI to identify flaws in a resume and suggest improvements.
-   **Impactful Rewrite**: Rewrites resume sections to emphasize impact and achievements.
-   **ATS Optimization**: Optimizes resumes to improve their score on Applicant Tracking Systems (ATS) by incorporating relevant keywords.
-   **Visual ATS Meter**: A visual gauge indicates how well the resume is optimized for a specific job.
-   **Tailored Cover Letter Generation**: Generates cover letters tailored to specific job descriptions with adjustable tones (e.g., Formal, Friendly).
-   **Real-time Preview**: A split-screen editor workspace to view your original resume alongside the AI-optimized version and generated cover letter.
-   **Application Analytics**: A dashboard to visualize application history and performance metrics.
-   **Resume Management**: A dedicated page to create, view, edit, and delete your resumes.

## 🚀 Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Generative AI**: [Google AI (Gemini) via Genkit](https://firebase.google.com/docs/genkit)
-   **Database**: [Supabase Postgres](https://supabase.com/) via `@supabase/supabase-js`

## 🛠️ Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

-   [Node.js](https://nodejs.org/en) (v18 or later recommended)
-   [npm](https://www.npmjs.com/)

### Installation & Setup

1.  **Clone the repository**
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies**
    ```sh
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```
    Open the `.env` file and add your Google AI API key. You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the application**
    The development script will automatically handle database migrations and seeding.
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## 📜 Available Scripts

-   `npm run dev`: Starts the development server with Turbopack, including database migration and seeding.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase for errors.
-   `npm run db:generate`: Generates new database migration files based on schema changes.
-   `npm run db:migrate`: Applies pending database migrations.
-   `npm run db:seed`: Seeds the database with initial sample data.
