'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2 } from 'lucide-react';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/start');
    }, 4000); // 4 seconds
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-fade-in-up">
        <div className="rounded-2xl bg-primary/10 p-4 text-primary shadow">
          <FileText className="h-12 w-12" />
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">FitLetter</h1>
        <p className="text-muted-foreground text-center max-w-md">
          AI-powered resumes and cover letters tailored for your next role.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}