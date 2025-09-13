
'use client';

import { getResumesForUser, deleteResume, parseResumeAndSave } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Resume } from '@/db/schema';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Loader2, MoreHorizontal, PlusCircle, Trash2, UploadCloud, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as pdfjs from 'pdfjs-dist';
import { Progress } from '@/components/ui/progress';

type ResumeWithParsedJson = Omit<
  Resume,
  'experiences' | 'education' | 'skills' | 'projects' | 'createdAt' | 'updatedAt'
> & {
  experiences: any[];
  education: any[];
  skills: any;
  projects: any[];
  createdAt: Date | null;
  updatedAt: Date | null;
};

const DocumentActions = ({ resume, onConfirmDelete }: { resume: ResumeWithParsedJson, onConfirmDelete: () => void }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();
  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => router.push(`/editor/${resume.id}`)}>
          <Edit className="mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
          <Trash2 className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the resume
                and any associated cover letters.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}


export default function ResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeWithParsedJson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number|null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedId = localStorage.getItem('fitletter_user_id');
    if (!storedId) {
      router.push('/');
      return;
    }
    const id = parseInt(storedId);
    setUserId(id);

    async function loadResumes() {
      setIsLoading(true);
      const { data, error } = await getResumesForUser(id);
      if (error) {
        console.error(error);
        toast({title: "Error", description: error, variant: 'destructive'})
      } else {
        setResumes(data as ResumeWithParsedJson[]);
      }
      setIsLoading(false);
    }
    loadResumes();
  }, [router, toast]);


  const handleDelete = async (id: number) => {
    const {error} = await deleteResume(id);
     if (error) {
        toast({title: "Error deleting resume", description: error, variant: 'destructive'})
      } else {
        toast({title: "Success", description: "Resume deleted."})
        setResumes(resumes.filter(r => r.id !== id));
      }
  };

  const onResumeCreated = (newResume: Resume) => {
      const fullyParsedResume: ResumeWithParsedJson = {
        ...newResume,
        createdAt: new Date(),
        updatedAt: null,
        experiences: JSON.parse(newResume.experiences as string),
        education: JSON.parse(newResume.education as string),
        skills: JSON.parse(newResume.skills as string),
        projects: JSON.parse(newResume.projects as string),
      }
      setResumes([fullyParsedResume, ...resumes]);
  }


  return (
    <div className="min-h-screen w-full bg-background/50">
      <main className="container mx-auto flex flex-col p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
           <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          <h1 className="font-headline text-3xl font-bold tracking-tight animate-fade-in-up">
            My Resumes
          </h1>
          <CreateResumeDialog onResumeCreated={onResumeCreated} userId={userId}>
            <Button className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <PlusCircle className="mr-2" />
                Create New Resume
            </Button>
          </CreateResumeDialog>
        </header>
        <Card className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <CardTitle>Manage Your Resumes</CardTitle>
            <CardDescription>
              Here you can view, edit, and create new resumes to use in your
              applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumes.length > 0 ? resumes.map((resume) => (
                  <TableRow key={resume.id} className="cursor-pointer" onClick={() => router.push(`/editor/${resume.id}`)}>
                    <TableCell className="font-medium">{resume.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{resume.summary}</TableCell>
                    <TableCell>{resume.createdAt ? format(resume.createdAt, 'PP') : 'N/A'}</TableCell>
                    <TableCell>
                      <DocumentActions resume={resume} onConfirmDelete={() => handleDelete(resume.id)} />
                    </TableCell>
                  </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No resumes found.
                          <CreateResumeDialog onResumeCreated={onResumeCreated} userId={userId}>
                            <Button variant="link">Create one now</Button>
                          </CreateResumeDialog>
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB


function CreateResumeDialog({ children, onResumeCreated, userId }: { children: React.ReactNode, onResumeCreated: (newResume: Resume) => void, userId: number | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [resumeText, setResumeText] = useState('');
    const [resumeTitle, setResumeTitle] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast({ title: 'File Too Large', description: `Please select a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.`, variant: 'destructive'});
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
        setIsParsing(true);

        const reader = new FileReader();

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(progress);
            }
        };

        reader.onloadend = () => {
            setIsParsing(false);
            setUploadProgress(null);
        };

        reader.onerror = () => {
            setIsParsing(false);
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


    const handleParse = async () => {
        if (!resumeText || !resumeTitle) {
            toast({ title: "Missing info", description: "Please provide a title and your resume content.", variant: "destructive"});
            return;
        }
         if (!userId) {
            toast({ title: "User not found", description: "You must be logged in to create a resume.", variant: "destructive"});
            return;
        }
        setIsParsing(true);
        const { data, error } = await parseResumeAndSave({ resumeText, title: resumeTitle, userId });
        if (data) {
            toast({ title: "Resume Created!", description: "Your new resume has been saved." });
            onResumeCreated(data);
            setResumeText('');
            setResumeTitle('');
            setIsOpen(false);
        } else {
            toast({ title: "Parsing Failed", description: error, variant: "destructive" });
        }
        setIsParsing(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create a New Resume</DialogTitle>
                    <DialogDescription>
                        Provide a title and paste your resume content below. We'll parse it into a structured format.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="new-resume-title">Resume Title</Label>
                        <Input id="new-resume-title" placeholder="e.g. My Product Manager Resume" value={resumeTitle} onChange={e => setResumeTitle(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-resume-text">Resume Content</Label>
                        <Textarea id="new-resume-text" placeholder="Paste your full resume content here..." className="min-h-64" value={resumeText} onChange={(e) => setResumeText(e.target.value)} />
                    </div>
                    <div className="text-center space-y-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md" className="hidden" />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                            {isParsing && uploadProgress === null ? <Loader2 className="mr-2 animate-spin"/> : <UploadCloud className="mr-2"/>}
                            Upload from File
                        </Button>
                         {uploadProgress !== null && <Progress value={uploadProgress} className="mt-4" />}
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleParse} disabled={isParsing || !resumeText}>
                        {isParsing ? <Loader2 className="mr-2 animate-spin"/> : <Wand2 className="mr-2" />}
                        Parse and Save Resume
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
