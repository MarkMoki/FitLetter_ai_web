
'use client';
import { getResumesForUser, signUpUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

function SplashScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <div className="flex animate-pulse items-center gap-4">
        <Sparkles className="h-12 w-12 text-primary" />
        <h1 className="font-headline text-5xl font-bold">FitLetter</h1>
      </div>
      <p className="mt-4 text-lg text-muted-foreground">
        Optimizing your job application...
      </p>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('fitletter_user_id');
    if (loggedInUserId) {
      router.push('/dashboard');
    } else {
       const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const handleAuthAction = () => {
    startTransition(async () => {
      if (!email) {
          toast({ title: 'Auth Failed', description: "Please enter an email.", variant: 'destructive' });
          return;
      }
      if (isSigningUp && !name) {
          toast({ title: 'Sign Up Failed', description: "Please enter your name.", variant: 'destructive' });
          return;
      }
      
      const { data: userData, error: userError } = await signUpUser({ email, name });

      if (userError || !userData) {
          toast({
              title: "Authentication Failed",
              description: `Could not log in or create an account. ${userError || ''}`,
              variant: "destructive",
          });
          return;
      }
      
      localStorage.setItem('fitletter_user_email', userData.email);
      localStorage.setItem('fitletter_user_id', userData.id.toString());
      localStorage.setItem('fitletter_user_name', userData.name || '');

      const { data: resumesData, error: resumesError } = await getResumesForUser(userData.id);

      if (resumesError) {
          toast({
              title: "Error",
              description: `Could not fetch user data. ${resumesError}`,
              variant: "destructive",
          });
          return;
      }
      
      if (resumesData && resumesData.length > 0) {
        toast({ title: 'Welcome back!', description: 'Redirecting to your dashboard.' });
        router.push('/dashboard');
      } else {
        toast({ title: 'Welcome!', description: 'Let\'s get you set up.' });
        router.push('/onboarding');
      }
    });
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background/50 p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileText className="h-6 w-6" />
                </div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                FitLetter
                </h1>
            </div>
          <CardTitle>{isSigningUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>{isSigningUp ? 'Enter your details to get started.' : 'Sign in to continue to your dashboard.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {isSigningUp && (
                 <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
            )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={handleAuthAction} disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSigningUp ? 'Sign Up' : 'Sign In'}
          </Button>
           <Button variant="link" className="w-full" onClick={() => setIsSigningUp(!isSigningUp)}>
            {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
