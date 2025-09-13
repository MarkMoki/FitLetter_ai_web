
'use client';
import {
  parseResumeAndSave,
  generateTailoredCoverLetter,
  generateAtsOptimizedResume,
  saveLetter,
  autofillJobDetailsAction
} from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  FileDown,
  FileText,
  Linkedin,
  Loader2,
  UploadCloud,
  Wand2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Resume } from '@/db/schema';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Slider } from '@/components/ui/slider';
import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';


const toneMapping = ['Formal', 'Friendly', 'Enthusiastic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


function downloadAsFile(content: string, fileName: string, format: 'txt' | 'pdf' = 'txt') {
    if (format === 'pdf') {
        const doc = new jsPDF();
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;
        let y = margin;
        
        const lines = doc.splitTextToSize(content, doc.internal.pageSize.width - margin * 2);

        lines.forEach((line: string) => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += doc.getLineHeight() / 2.8; // Adjust line height factor for better spacing
        });

        doc.save(`${fileName}.pdf`);
    } else {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { width, height } = useWindowSize();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeTitle, setResumeTitle] = useState('');
  const [parsedResume, setParsedResume] = useState<Resume | null>(null);
  
  const [jobPostingText, setJobPostingText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [toneIndex, setToneIndex] = useState(0);

  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [optimizedResume, setOptimizedResume] = useState('');
  const [newAtsScore, setNewAtsScore] = useState<number | null>(null);
  const [applicationUrl, setApplicationUrl] = useState('');


  const [showConfetti, setShowConfetti] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSkipAlertOpen, setIsSkipAlertOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem('fitletter_user_id');
    if (!storedId) {
        router.push('/');
        return;
    }
    setUserId(parseInt(storedId));
  }, [router]);

  const handleParseResume = async () => {
    if (!resumeText || !resumeTitle) {
        toast({ title: "Missing info", description: "Please provide a title and your resume content.", variant: "destructive"});
        return;
    }
     if (!userId) {
        toast({ title: "User not found", description: "You must be logged in to create a resume.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    const { data, error } = await parseResumeAndSave({ resumeText, title: resumeTitle, userId });
    if (data) {
        const fullyParsedResume: Resume = {
            ...data,
            skills: typeof data.skills === 'string' ? JSON.parse(data.skills) : data.skills,
            experiences: typeof data.experiences === 'string' ? JSON.parse(data.experiences) : data.experiences,
            projects: typeof data.projects === 'string' ? JSON.parse(data.projects) : data.projects,
            education: typeof data.education === 'string' ? JSON.parse(data.education) : data.education
        }
        setParsedResume(fullyParsedResume);
        setCurrentStep(2);
        toast({ title: "Resume Parsed!", description: "Your resume has been successfully parsed." });
    } else {
        toast({ title: "Parsing Failed", description: error, variant: "destructive" });
    }
    setIsLoading(false);
  }

  const handleGenerate = async () => {
    if (!parsedResume || !jobTitle || !companyName || !jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all job details.',
        variant: 'destructive',
      });
      return;
    }
    
    const resumeContent = parsedResume ? `Summary: ${parsedResume.summary}\n\nSkills: ${(parsedResume.skills as string[]).join(', ')}\n\nExperience: ${(parsedResume.experiences as any[]).map((exp: any) => `- ${exp.role} at ${exp.company}: ${exp.impact.join(', ')}`).join('\n')}\n\nProjects: ${(parsedResume.projects as any[]).map((proj: any) => `- ${proj.title}: ${proj.description}`).join('\n')}\n\nEducation: ${(parsedResume.education as any[]).map((edu: any) => `- ${edu.degree} from ${edu.school} (${edu.year})`).join('\n')}` : '';

    setIsLoading(true);
    setGeneratedCoverLetter('');
    setOptimizedResume('');
    setNewAtsScore(null);

    try {
      const coverLetterPromise = generateTailoredCoverLetter({
        resume: resumeContent,
        jobTitle,
        company: companyName,
        jobDescription,
        tone: toneMapping[toneIndex],
      });

      const atsPromise = generateAtsOptimizedResume({
        resume: resumeContent,
        jobDescription,
      });

      const [coverLetterResult, atsResult] = await Promise.all([
        coverLetterPromise,
        atsPromise,
      ]);

      if (coverLetterResult.data) {
        setGeneratedCoverLetter(coverLetterResult.data.coverLetter);
      } else {
        throw new Error(
          coverLetterResult.error || 'Failed to generate cover letter.'
        );
      }

      if (atsResult.data) {
        setOptimizedResume(atsResult.data.optimizedResume);
        setNewAtsScore(atsResult.data.atsScore);
      } else {
        throw new Error(
          atsResult.error || 'Failed to optimize resume.'
        );
      }

      if (
        coverLetterResult.data &&
        atsResult.data &&
        parsedResume && 
        userId
      ) {
        await saveLetter({
          jobTitle,
          company: companyName,
          jobDesc: jobDescription,
          content: coverLetterResult.data.coverLetter,
          tone: toneMapping[toneIndex],
          atsScore: atsResult.data.atsScore,
          resumeId: parsedResume.id,
          userId
        });
        toast({
          title: 'Success!',
          description: 'Your application documents have been generated and saved.',
        });
        setShowConfetti(true);
      }
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `Please select a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        variant: 'destructive',
      });
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isTxt = file.type === 'text/plain' || file.name.endsWith('.txt');
    const isMd = file.type === 'text/markdown' || file.name.endsWith('.md');

    if (!isPdf && !isTxt && !isMd) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a .pdf, .txt, or .md file.',
        variant: 'destructive',
      });
      return;
    }
    
    setUploadProgress(0);
    setIsLoading(true);

    const reader = new FileReader();

    reader.onprogress = (e) => {
        if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
        }
    };

    reader.onloadend = () => {
        setIsLoading(false);
        setUploadProgress(null);
    };

    reader.onerror = () => {
        setIsLoading(false);
        setUploadProgress(null);
        toast({ title: 'Error reading file', description: 'There was an issue reading your file.', variant: 'destructive'})
    }

    if (isPdf) {
      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
            const pdf = await pdfjs.getDocument(typedArray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
              fullText += pageText + '\n\n';
            }
            setResumeText(fullText.trim());
            toast({ title: 'PDF loaded!', description: 'The content of your PDF resume has been loaded.' });
          } catch (error) {
            console.error("PDF parsing error: ", error);
            toast({ title: 'Error reading PDF', description: "Could not parse the PDF file. Please ensure it's a valid, text-based PDF.", variant: 'destructive'})
            setResumeText('');
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setResumeText(text);
            toast({ title: 'File loaded!', description: 'The content of your file has been loaded.' });
        };
        reader.readAsText(file);
    }
  }

  const handleComingSoon = () => {
    toast({
        title: "Feature Coming Soon!",
        description: "We're working on this feature. For now, please upload a file or paste text.",
    });
  }

  const handleAutofill = async () => {
    if (!jobPostingText) return;
    setIsAutofilling(true);
    const { data, error } = await autofillJobDetailsAction({ jobPostingText });
    if (data) {
        if(data.jobTitle) setJobTitle(data.jobTitle);
        if(data.companyName) setCompany(data.companyName);
        if(data.jobDescription) setJobDescription(data.jobDescription);
        if(data.url) setApplicationUrl(data.url);
        toast({ title: 'Success', description: 'Job details have been autofilled.'});
    } else {
        toast({ title: 'Autofill Failed', description: error, variant: 'destructive' });
    }
    setIsAutofilling(false);
  }

  const skipMessages: Record<number, string> = {
    1: "By skipping this step, you'll miss out on starting with a pre-parsed resume. You can always add one later from the Resumes page, but we recommend starting here for the best experience!",
    2: "Are you sure you want to skip? Generating your first application helps you get familiar with the core tools. You can explore the dashboard and create an application later."
  }


  return (
    <div className="min-h-screen w-full bg-background/50">
      <AlertDialog open={isSkipAlertOpen} onOpenChange={setIsSkipAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to skip?</AlertDialogTitle>
            <AlertDialogDescription>
              {skipMessages[currentStep]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nevermind</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/dashboard')}>Yes, skip for now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <main className="container mx-auto flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="mx-auto mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Welcome to FitLetter
          </h1>
        </div>
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle>
                    Step {currentStep}: {currentStep === 1 ? 'Import Your Resume' : 'Generate Your First Application'}
                </CardTitle>
                <CardDescription>
                    {currentStep === 1 ? 'Let\'s start by importing your existing resume. We\'ll parse it to get started.' : 'Now, let\'s create a tailored cover letter and optimized resume for a specific job.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {currentStep === 1 && (
                     <div className="space-y-4">
                         <div className="grid gap-2">
                             <Label htmlFor="resume-title">Resume Title</Label>
                             <Input id="resume-title" placeholder="e.g. My Software Engineer Resume" value={resumeTitle} onChange={e => setResumeTitle(e.target.value)} />
                         </div>
                        <Tabs defaultValue="paste">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="paste"><FileText className="mr-2"/>Paste Text</TabsTrigger>
                                <TabsTrigger value="upload"><UploadCloud className="mr-2" />Upload File</TabsTrigger>
                                <TabsTrigger value="linkedin" disabled><Linkedin className="mr-2" />Import from LinkedIn (Soon)</TabsTrigger>
                            </TabsList>
                            <TabsContent value="paste" className="space-y-4">
                                <Textarea 
                                    placeholder="Paste your full resume content here..." 
                                    className="min-h-64"
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                />
                                
                            </TabsContent>
                             <TabsContent value="upload" className="space-y-4 text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground mb-4">Click the button below to select a resume file from your computer (.pdf, .txt, .md).</p>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md" className="hidden" />
                                <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <UploadCloud className="mr-2"/>}
                                    Select a File
                                </Button>
                                {uploadProgress !== null && <Progress value={uploadProgress} className="mt-4" />}
                            </TabsContent>
                             <TabsContent value="linkedin" className="space-y-4 text-center p-8 border rounded-lg">
                                <p className="text-muted-foreground">This feature is coming soon. For now, please paste your resume text.</p>
                                <Button onClick={handleComingSoon}><Linkedin className="mr-2"/>Import from LinkedIn</Button>
                            </TabsContent>
                        </Tabs>
                         <Button onClick={handleParseResume} disabled={isLoading || !resumeText} className="w-full" size="lg">
                            {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Wand2 className="mr-2" />}
                            Parse Resume & Continue
                        </Button>
                        <div className="text-center">
                            <Button variant="link" className="text-muted-foreground" onClick={() => setIsSkipAlertOpen(true)}>Skip for now</Button>
                        </div>
                    </div>
                )}
                {currentStep === 2 && parsedResume && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Side */}
                            <div className="space-y-4">
                                <div className='space-y-2'>
                                    <Label htmlFor="job-posting-text">Paste Job Posting or Link</Label>
                                    <Textarea 
                                        id="job-posting-text"
                                        placeholder="Paste a share link (e.g., from LinkedIn) or the full job posting text here..."
                                        className="min-h-[100px]"
                                        value={jobPostingText}
                                        onChange={(e) => setJobPostingText(e.target.value)}
                                    />
                                    <Button onClick={handleAutofill} disabled={isAutofilling || !jobPostingText} className="w-full" variant="secondary">
                                        {isAutofilling ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                                        Autofill Details
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="job-title">Job Title</Label>
                                        <Input
                                        id="job-title"
                                        placeholder="e.g. Software Engineer"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="company-name">Company Name</Label>
                                        <Input
                                        id="company-name"
                                        placeholder="e.g. Acme Inc."
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="job-url">Job URL</Label>
                                    <Input
                                        id="job-url"
                                        placeholder="https://www.linkedin.com/jobs/view/..."
                                        value={applicationUrl}
                                        onChange={(e) => setApplicationUrl(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="job-description">Job Description</Label>
                                    <Textarea
                                        id="job-description"
                                        placeholder="Paste the job description here..."
                                        className="min-h-[150px]"
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Cover Letter Tone: <span className="font-bold text-primary">{toneMapping[toneIndex]}</span></Label>
                                    <Slider
                                        value={[toneIndex]}
                                        onValueChange={(value) => setToneIndex(value[0])}
                                        min={0}
                                        max={2}
                                        step={1}
                                    />
                                </div>
                            </div>
                            {/* Right Side */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                        <span>Optimized Resume</span>
                                        <div className='flex items-center gap-2'>
                                        {newAtsScore && (
                                            <span className="text-lg font-bold text-primary">
                                            ATS Score: {newAtsScore}
                                            </span>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => downloadAsFile(optimizedResume, 'optimized-resume', 'pdf')} disabled={!optimizedResume}><FileDown className='mr-2'/>Download PDF</Button>
                                        </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea
                                            className="min-h-[200px] text-xs"
                                            value={isLoading && !optimizedResume ? "Generating..." : optimizedResume}
                                            readOnly
                                        />
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className='flex items-center justify-between'>
                                            <span>Generated Cover Letter</span>
                                            <Button variant="outline" size="sm" onClick={() => downloadAsFile(generatedCoverLetter, 'cover-letter', 'pdf')} disabled={!generatedCoverLetter}><FileDown className='mr-2'/>Download PDF</Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                    <Textarea
                                        className="min-h-[200px] text-xs"
                                        value={isLoading && !generatedCoverLetter ? "Generating..." : generatedCoverLetter}
                                        readOnly
                                    />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <Button variant="link" className="text-muted-foreground" onClick={() => setIsSkipAlertOpen(true)}>Skip for now</Button>
                            <div className="flex gap-2">
                                 <Button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    variant="secondary"
                                >
                                    {isLoading ? (
                                    <Loader2 className="mr-2 animate-spin" />
                                    ) : (
                                    <Wand2 className="mr-2" />
                                    )}
                                    {generatedCoverLetter ? "Regenerate" : "Generate"}
                                </Button>
                                <Button
                                    onClick={() => router.push('/dashboard')}
                                    disabled={isLoading || (!generatedCoverLetter && !optimizedResume)}
                                    className="font-bold"
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
