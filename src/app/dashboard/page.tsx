import { requireAuth } from '@/lib/auth';
import { getResumesForUser, getLettersForUser, getApplicationsForUser } from '@/app/actions';
import { Dashboard as DashboardComponent } from '@/components/dashboard';
import { format } from 'date-fns';
import type { Resume, Letter, Application } from '@/db/schema';

type FormattedResume = Omit<Resume, 'createdAt' | 'updatedAt'> & { 
  createdAt: string; 
  updatedAt: string | null; 
};
type FormattedLetter = Omit<Letter, 'createdAt'> & { createdAt: string };

export default async function DashboardPage() {
  // Require authentication - will redirect if not authenticated
  const { user } = await requireAuth();

  try {
    // Fetch all data in parallel
    const [resumesResult, lettersResult, applicationsResult] = await Promise.all([
      getResumesForUser(user.id),
      getLettersForUser(user.id),
      getApplicationsForUser(user.id)
    ]);

    // Handle errors
    if (resumesResult.error) {
      throw new Error(`Failed to load resumes: ${resumesResult.error}`);
    }
    if (lettersResult.error) {
      throw new Error(`Failed to load letters: ${lettersResult.error}`);
    }
    if (applicationsResult.error) {
      throw new Error(`Failed to load applications: ${applicationsResult.error}`);
    }

    // Format data for display
    const formattedResumes: FormattedResume[] = (resumesResult.data || []).map(r => ({
      ...r,
      createdAt: r.createdAt ? format(new Date(r.createdAt), 'PP') : '',
      updatedAt: r.updatedAt ? format(new Date(r.updatedAt), 'PP') : null,
    }));

    const formattedLetters: FormattedLetter[] = (lettersResult.data || []).map(l => ({
      ...l,
      createdAt: l.createdAt ? format(new Date(l.createdAt), 'PP') : '',
    }));

    const applications: Application[] = applicationsResult.data || [];

    return (
      <DashboardComponent 
        resumes={formattedResumes as any} 
        letters={formattedLetters as any} 
        applications={applications as any} 
      />
    );
  } catch (error) {
    console.error('Dashboard data loading error:', error);
    
    return (
      <div className="min-h-screen w-full bg-background/50">
        <main className="container mx-auto flex flex-col p-4 sm:p-8">
          <div className="flex flex-col items-center justify-center flex-1 text-center">
            <h2 className="text-2xl font-semibold mb-4">Error Loading Dashboard</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Failed to load dashboard data'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }
}