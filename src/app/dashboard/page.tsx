
'use client';

import {Dashboard as DashboardComponent} from '@/components/dashboard';
import { db } from '@/db';
import { users, resumes as resumesTable, letters as lettersTable, Resume, Letter, applications as applicationsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { getApplicationsForUser, getLettersForUser, getResumesForUser } from '../actions';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Nav } from '@/components/nav';


const LoadingSkeleton = () => (
    <div className="min-h-screen w-full bg-background/50">
      <main className="container mx-auto flex flex-col p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <Nav />
        </header>
        <div className="grid gap-8">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </main>
    </div>
)


export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem('fitletter_user_id');
    if (!userId) {
        router.push('/');
        return;
    }
    
    async function loadData() {
        setLoading(true);
        const id = parseInt(userId);
        const [resumesResult, lettersResult, applicationsResult] = await Promise.all([
            getResumesForUser(id),
            getLettersForUser(id),
            getApplicationsForUser(id)
        ]);
        
        if (resumesResult.data) setResumes(resumesResult.data as any[]);
        if (lettersResult.data) setLetters(lettersResult.data);
        if (applicationsResult.data) setApplications(applicationsResult.data);

        setLoading(false);
    }

    loadData();

  }, [router]);

  if (loading) {
      return <LoadingSkeleton />;
  }

  const formattedResumes = resumes.map(r => ({
      ...r,
      createdAt: r.createdAt ? format(new Date(r.createdAt), 'PP') : '',
      updatedAt: r.updatedAt ? format(new Date(r.updatedAt), 'PP') : '',
  }))

  const formattedLetters = letters.map(l => ({
      ...l,
      createdAt: l.createdAt ? format(new Date(l.createdAt), 'PP') : '',
  }))


  return (
    <DashboardComponent resumes={formattedResumes as any} letters={formattedLetters as any} applications={applications as any} />
  );
}
