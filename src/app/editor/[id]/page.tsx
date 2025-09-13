
'use client';
import {
  getResumesForUser,
  generateTailoredCoverLetter,
  generateAtsOptimizedResume,
  saveLetter,
  autofillJobDetailsAction,
  updateResume,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type { Resume, ResumeFlawSpotterOutput } from '@/db/schema';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronDown, ChevronsUpDown, FileDown, Loader2, Save, Sparkles, Wand2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { findResumeFlaws, generateImpactfulRewrite } from '@/app/actions';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { Nav } from '@/components/nav';

type Experience = { role: string; company: string; dates: string; impact: string[] };
type Education = { degree: string; school: string; year: string };
type Project = { title: string; techUsed: string; description: string, impact?: string };
type Skills = string[];

type ResumeWithParsedJson = Omit<
  Resume,
  'experiences' | 'education' | 'skills' | 'projects' | 'createdAt' | 'updatedAt'
> & {
  experiences: Experience[];
  education: Education[];
  skills: Skills;
  projects: Project[];
  createdAt: Date;
  updatedAt: Date | null;
};

const toneMapping = ['Formal', 'Friendly', 'Enthusiastic'];

function downloadAsFile(content: string, fileName: string, format: 'txt' | 'pdf' | 'docx' = 'txt') {
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
        a.download = `${fileName}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    }
}


const DownloadButton = ({ content, fileName }: { content: string, fileName: string}) => {
    if (!content) return null;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileDown className="mr-2" />
                    Download
                    <ChevronDown className="ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => downloadAsFile(content, fileName, 'txt')}>Plain Text (.txt)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadAsFile(content, fileName, 'pdf')}>PDF (.pdf)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadAsFile(content, fileName, 'docx')} disabled>Word (.docx) - Soon</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingResume, setIsRegeneratingResume] = useState(false);
  const [isRegeneratingLetter, setIsRegeneratingLetter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [resumes, setResumes] = useState<ResumeWithParsedJson[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeWithParsedJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<ResumeFlawSpotterOutput | null>(null);
  const [rewriteResult, setRewriteResult] = useState<string | null>(null);
  const [sectionToRewrite, setSectionToRewrite] = useState('summary');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const [jobPostingText, setJobPostingText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [toneIndex, setToneIndex] = useState(0);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [optimizedResume, setOptimizedResume] = useState('');
  const [newAtsScore, setNewAtsScore] = useState<number | null>(null);
  const [applicationUrl, setApplicationUrl] = useState('');
  const [userId, setUserId] = useState<number|null>(null);

  const isNew = params.id === 'new';

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
        toast({
          title: 'Error loading resumes',
          description: error,
          variant: 'destructive',
        });
      } else if (data) {
        const parsedData = data as ResumeWithParsedJson[];
        setResumes(parsedData);
        if (parsedData.length > 0) {
          const resumeIdToSelect = isNew ? parsedData[0].id : parseInt(params.id as string);
          const resume = parsedData.find(r => r.id === resumeIdToSelect) || parsedData[0];
          setSelectedResume(resume);
        }
      }
      setIsLoading(false);
    }
    loadResumes();
  }, [toast, isNew, params.id, router]);

  const resumeContent = useMemo(() => {
    if (!selectedResume) return 'Select a resume to view its content.';
    
    const { name, phone, email, linkedinUrl, portfolioUrl, summary, skills, experiences, projects, education } = selectedResume;
    
    return `${name} | ${phone} | ${email} ${linkedinUrl ? `| ${linkedinUrl}` : ''} ${portfolioUrl ? `| ${portfolioUrl}` : ''}
---
**Professional Summary**
${summary}

---
**Skills**
${skills?.join(', ') || 'N/A'}

---
**Professional Experience**
${experiences?.map(exp => `
**${exp.role}** | ${exp.company} | ${exp.dates}
${exp.impact.map(item => `- ${item}`).join('\n')}
`).join('\n') || 'N/A'}

---
**Projects**
${projects?.map(proj => `
**${proj.title}** | ${proj.techUsed}
*${proj.description}*
${proj.impact ? `- ${proj.impact}` : ''}
`).join('\n') || 'N/A'}

---
**Education**
${education?.map(edu => `- ${edu.degree}, ${edu.school} (${edu.year})`).join('\n') || 'N/A'}
`;
  }, [selectedResume]);

  const handleGenerate = async () => {
    if (!selectedResume || !jobTitle || !companyName || !jobDescription || !userId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all job details, select a resume and be logged in.',
        variant: 'destructive',
      });
      return;
    }
    setIsGenerating(true);

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
        isNew &&
        selectedResume
      ) {
        await saveLetter({
          jobTitle,
          company: companyName,
          jobDesc: jobDescription,
          content: coverLetterResult.data.coverLetter,
          tone: toneMapping[toneIndex],
          atsScore: atsResult.data.atsScore,
          resumeId: selectedResume.id,
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
      setIsGenerating(false);
    }
  };

  const handleRegenerateResume = async () => {
    if (!selectedResume || !jobDescription || !optimizedResume) {
        toast({ title: 'Cannot Regenerate', description: 'Please generate an optimized resume first.', variant: 'destructive' });
        return;
    }
    setIsRegeneratingResume(true);
    const { data, error } = await generateAtsOptimizedResume({
        resume: resumeContent,
        jobDescription,
        currentOptimizedResume: optimizedResume,
        currentAtsScore: newAtsScore || undefined,
    });
    if (data) {
        setOptimizedResume(data.optimizedResume);
        setNewAtsScore(data.atsScore);
        toast({ title: 'Resume Regenerated!', description: 'The optimized resume has been improved.' });
    } else {
        toast({ title: 'Regeneration Failed', description: error, variant: 'destructive' });
    }
    setIsRegeneratingResume(false);
  }

  const handleRegenerateCoverLetter = async () => {
    if (!selectedResume || !jobDescription || !generatedCoverLetter) {
        toast({ title: 'Cannot Regenerate', description: 'Please generate a cover letter first.', variant: 'destructive' });
        return;
    }
    setIsRegeneratingLetter(true);
     const { data, error } = await generateTailoredCoverLetter({
        resume: resumeContent,
        jobTitle,
        company: companyName,
        jobDescription,
        tone: toneMapping[toneIndex],
        currentCoverLetter: generatedCoverLetter,
    });
     if (data) {
        setGeneratedCoverLetter(data.coverLetter);
        toast({ title: 'Cover Letter Regenerated!', description: 'The cover letter has been improved.' });
    } else {
        toast({ title: 'Regeneration Failed', description: error, variant: 'destructive' });
    }
    setIsRegeneratingLetter(false);
  }

  const handleSaveResume = async () => {
      if (!selectedResume) return;
      setIsSaving(true);
      const { error } = await updateResume({
        ...selectedResume,
        skills: selectedResume.skills as any,
        experiences: selectedResume.experiences as any,
        education: selectedResume.education as any,
        projects: selectedResume.projects as any,
      });
      if (error) {
        toast({ title: 'Save Failed', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Resume Saved!', description: 'Your changes have been saved.'});
      }
      setIsSaving(false);
  }

  const handleSaveLetter = async () => {
    if (!selectedResume || !jobTitle || !companyName || !jobDescription || !generatedCoverLetter || !userId) {
        toast({ title: "Cannot Save", description: "Please generate a cover letter first and ensure all fields are filled.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    const { error } = await saveLetter({
        jobTitle,
        company: companyName,
        jobDesc: jobDescription,
        content: generatedCoverLetter,
        tone: toneMapping[toneIndex],
        atsScore: newAtsScore || 0,
        resumeId: selectedResume.id,
        userId
    });

    if (error) {
        toast({ title: 'Save Failed', description: error, variant: 'destructive' });
    } else {
        toast({ title: 'Cover Letter Saved!', description: 'Your new cover letter has been saved.'});
        setShowConfetti(true);
        router.push('/dashboard');
    }
    setIsSaving(false);
  }

  const handleAnalyze = async () => {
    if (!selectedResume) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const { data, error } = await findResumeFlaws({
      resumeText: resumeContent,
    });
    if (data) {
      setAnalysisResult(data as ResumeFlawSpotterOutput);
    } else {
      toast({ title: 'Analysis Failed', description: error, variant: 'destructive' });
    }
    setIsAnalyzing(false);
  };
  
    const handleApplySuggestion = (originalText: string, suggestedText: string) => {
        if (!selectedResume) return;
        
        let updated = false;
        const newResume = { ...selectedResume };

        if (newResume.summary.includes(originalText)) {
            newResume.summary = newResume.summary.replace(originalText, suggestedText);
            updated = true;
        }

        newResume.experiences.forEach((exp, index) => {
            exp.impact.forEach((imp, i) => {
                if (imp.includes(originalText.replace(/^- /, ''))) {
                    newResume.experiences[index].impact[i] = suggestedText.replace(/^- /, '');
                    updated = true;
                }
            })
        });
        
        if (updated) {
            setSelectedResume(newResume);
            toast({ title: "Suggestion Applied", description: "The resume has been updated. Saving..." });
            handleSaveResume();
        } else {
            toast({ title: "Apply Failed", description: "Could not automatically apply the suggestion.", variant: 'destructive' });
        }
    }


  const handleRewrite = async () => {
    if (!selectedResume) return;
    setIsRewriting(true);
    setRewriteResult(null);
    let sectionText = '';
    
    const [sectionType, sectionIndex] = sectionToRewrite.split('-');
    const index = parseInt(sectionIndex);

    if (sectionType === 'summary') {
        sectionText = selectedResume.summary;
    } else if (sectionType === 'skills') {
        sectionText = selectedResume.skills.join(', ');
    } else if (sectionType === 'experience' && selectedResume.experiences?.[index]) {
        sectionText = selectedResume.experiences[index].impact.join('\n');
    } else if (sectionType === 'project' && selectedResume.projects?.[index]) {
        sectionText = `${selectedResume.projects[index].description}\n${selectedResume.projects[index].impact || ''}`;
    } else if (sectionType === 'education' && selectedResume.education?.[index]) {
        const edu = selectedResume.education[index];
        sectionText = `${edu.degree}, ${edu.school} (${edu.year})`;
    }

    const { data, error } = await generateImpactfulRewrite({
      resumeSection: sectionType,
      currentText: sectionText,
      jobDescription: jobDescription || undefined,
    });

    if (data) {
      setRewriteResult(data.rewrittenText);
    } else {
      toast({ title: 'Rewrite Failed', description: error, variant: 'destructive' });
    }
    setIsRewriting(false);
  };
  
  const handleApplyRewrite = () => {
    if (!rewriteResult || !selectedResume) return;

    const newResume = { ...selectedResume };
    const [sectionType, sectionIndex] = sectionToRewrite.split('-');
    const index = parseInt(sectionIndex);

    if (sectionType === 'summary') {
        newResume.summary = rewriteResult;
    } else if (sectionType === 'skills') {
        newResume.skills = rewriteResult.split(',').map(s => s.trim()).filter(Boolean);
    } else if (sectionType === 'experience' && newResume.experiences?.[index]) {
        newResume.experiences[index].impact = rewriteResult.split('\n').map(s => s.replace(/^- /, ''));
    } else if (sectionType === 'project' && newResume.projects?.[index]) {
        const [description, impact] = rewriteResult.split('\n- Impact: ');
        newResume.projects[index].description = description ? description.replace(/^\*/, '').replace(/\*$/, '').trim() : '';
        newResume.projects[index].impact = impact ? impact.trim() : undefined;
    } else if (sectionType === 'education' && newResume.education?.[index]) {
        const [degree, rest] = rewriteResult.split(', ');
        if(degree && rest) {
            const [school, year] = rest.split(' (');
            newResume.education[index] = {
                degree,
                school,
                year: year ? year.replace(')', '') : '',
            };
        }
    }

    setSelectedResume(newResume);
    setRewriteResult(null);
    toast({ title: "Resume Updated", description: "The section has been updated with the rewritten text. Saving..." });
    handleSaveResume();
  }

  const handleAutofill = async () => {
    if (!jobPostingText) return;
    setIsAutofilling(true);
    const { data, error } = await autofillJobDetailsAction({ jobPostingText });
    if (data) {
        if(data.jobTitle) setJobTitle(data.jobTitle);
        if(data.companyName) setCompanyName(data.companyName);
        if(data.jobDescription) setJobDescription(data.jobDescription);
        if(data.url) setApplicationUrl(data.url);
        toast({ title: 'Success', description: 'Job details have been autofilled.'});
    } else {
        toast({ title: 'Autofill Failed', description: error, variant: 'destructive' });
    }
    setIsAutofilling(false);
  }
  
    const rewriteOptions = useMemo(() => {
        if (!selectedResume) return [];
        const options = [{ value: 'summary', label: 'Summary' }];
        
        if (selectedResume.skills && selectedResume.skills.length > 0) {
            options.push({ value: 'skills', label: 'Skills' });
        }
        
        if (selectedResume.experiences && selectedResume.experiences.length > 0) {
            selectedResume.experiences.forEach((exp, index) => {
                options.push({ value: `experience-${index}`, label: `Exp: ${exp.role.substring(0, 20)}...` });
            });
        }
        
        if (selectedResume.projects && selectedResume.projects.length > 0) {
            selectedResume.projects.forEach((proj, index) => {
                options.push({ value: `project-${index}`, label: `Proj: ${proj.title.substring(0, 20)}...` });
            });
        }

        if (selectedResume.education && selectedResume.education.length > 0) {
            selectedResume.education.forEach((edu, index) => {
                options.push({ value: `education-${index}`, label: `Edu: ${edu.degree.substring(0, 20)}...` });
            });
        }
        return options;
    }, [selectedResume]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!isLoading && resumes.length === 0) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-semibold">No Resumes Found</h2>
                <p className="text-muted-foreground">You need to create a resume before you can use the editor.</p>
                <Button onClick={() => router.push('/resumes')}>Go to Resumes Page</Button>
            </div>
        )
    }

  return (
    <div className="min-h-screen w-full bg-background/50">
      {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <main className="container mx-auto flex flex-col p-4 sm:p-8">
        <header className="mb-8 flex items-center justify-between">
          <Nav />
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Job Description and AI Actions */}
          <div className="flex flex-col gap-8">
            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle>Autofill Job Details</CardTitle>
                    <CardDescription>
                        Paste a job link or the full text of a job posting below and let AI extract the details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Textarea 
                        id="job-posting-text"
                        placeholder="Paste a share link (e.g., from LinkedIn) or the full job posting text here..."
                        className="min-h-[100px]"
                        value={jobPostingText}
                        onChange={(e) => setJobPostingText(e.target.value)}
                    />
                    <Button onClick={handleAutofill} disabled={isAutofilling || !jobPostingText} className="w-full">
                        {isAutofilling ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                        Autofill from Posting
                    </Button>
                </CardContent>
            </Card>


            <Card className="flex-1 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <CardHeader>
                <CardTitle>Job & Resume Details</CardTitle>
                <CardDescription>
                  Provide the job description and select your resume to tailor your documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="resume">Select Resume</Label>
                  <Select
                    value={selectedResume?.id.toString()}
                    onValueChange={(value) => {
                      const resume = resumes.find(
                        (r) => r.id.toString() === value
                      );
                      setSelectedResume(resume || null);
                    }}
                    disabled={isLoading || resumes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoading ? 'Loading...' : 'Select a resume'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem
                          key={resume.id}
                          value={resume.id.toString()}
                        >
                          {resume.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="application-url">Job URL</Label>
                    <Input
                      id="application-url"
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
                    className="min-h-[150px] lg:min-h-[200px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-4">
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
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedResume}
                    className="w-full font-bold"
                    size="lg"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2" />
                    )}
                    Generate / Optimize
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <CardHeader>
                <CardTitle>AI Resume Tools</CardTitle>
                <CardDescription>
                  Enhance your resume with AI-powered analysis and rewrites.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* AI Rewrite */}
                  <div className="space-y-2">
                    <Label>Impactful Rewrite</Label>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            className="w-full justify-between"
                            disabled={!selectedResume}
                            >
                            {sectionToRewrite
                                ? rewriteOptions.find((opt) => opt.value === sectionToRewrite)?.label
                                : "Select a section..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                            <CommandInput placeholder="Search section..." />
                            <CommandList>
                                <CommandEmpty>No section found.</CommandEmpty>
                                <CommandGroup>
                                {rewriteOptions.map((opt) => (
                                    <CommandItem
                                    key={opt.value}
                                    value={opt.value}
                                    onSelect={(currentValue) => {
                                        setSectionToRewrite(currentValue === sectionToRewrite ? "" : currentValue)
                                        setComboboxOpen(false)
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        sectionToRewrite === opt.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {opt.label}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Button
                      onClick={handleRewrite}
                      disabled={isRewriting || !selectedResume || !sectionToRewrite}
                      className="w-full"
                      variant="secondary"
                    >
                      {isRewriting ? (
                        <Loader2 className="mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2" />
                      )}
                      Rewrite Section
                    </Button>
                  </div>

                  {/* Resume Flaw Spotter */}
                  <div className="space-y-2 flex flex-col">
                    <Label>Resume Flaw Analysis</Label>
                     <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !selectedResume}
                      className="w-full mt-auto"
                      variant="secondary"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2" />
                      )}
                      Analyze for Flaws
                    </Button>
                  </div>
                </div>

                {rewriteResult && (
                    <div className="space-y-2 rounded-md border p-4">
                        <Label>AI Suggestion:</Label>
                        <Textarea readOnly value={rewriteResult} className="min-h-[100px] bg-muted" />
                        <Button onClick={handleApplyRewrite} className="w-full">Apply Rewrite & Save</Button>
                    </div>
                )}

                {analysisResult && (
                      <div className="space-y-4 rounded-md border p-4 text-sm">
                        <h4 className="font-semibold">AI Feedback:</h4>
                        <p className="text-muted-foreground italic">
                          "{analysisResult.overallFeedback}"
                        </p>
                        <h4 className="font-semibold">Suggestions:</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {analysisResult.suggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-md">
                                <p className="text-destructive line-through">{suggestion.originalText}</p>
                                <p className="text-green-600">{suggestion.suggestionText}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs text-muted-foreground">{suggestion.comment}</p>
                                    <Button size="sm" variant="outline" onClick={() => handleApplySuggestion(suggestion.originalText, suggestion.suggestionText)}>Apply & Save</Button>
                                </div>
                            </div>
                        ))}
                        </div>
                      </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Resume and Cover Letter */}
          <div className="space-y-8">
            <Card className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>Original Resume</CardTitle>
                    <CardDescription>
                    Your base resume. Select from the dropdown on the left.
                    </CardDescription>
                </div>
                <Button onClick={handleSaveResume} disabled={isSaving || !selectedResume}>
                    {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                    Save Resume
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-[250px] text-xs"
                  placeholder="Your resume content will appear here..."
                  value={isLoading ? 'Loading resume...' : resumeContent}
                  readOnly
                />
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Optimized Resume</CardTitle>
                    <CardDescription>
                      This version is optimized for the job description.
                    </CardDescription>
                  </div>
                  <div className='flex items-center gap-2'>
                    {newAtsScore !== null && (
                      <span className="text-lg font-bold text-primary">
                        ATS Score: {newAtsScore}
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={handleRegenerateResume} disabled={isRegeneratingResume || !optimizedResume}>
                        {isRegeneratingResume ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                        Regenerate
                    </Button>
                    <DownloadButton content={optimizedResume} fileName="optimized-resume" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-[250px] text-xs"
                  value={isGenerating && !optimizedResume ? "Generating..." : optimizedResume}
                  readOnly
                />
              </CardContent>
            </Card>
            <Card className="animate-fade-in-up" style={{animationDelay: '0.5s'}}>
              <CardHeader>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <div>
                      <CardTitle>Generated Cover Letter</CardTitle>
                      <CardDescription>
                          A tailored cover letter will be generated here.
                      </CardDescription>
                    </div>
                  <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleRegenerateCoverLetter} disabled={isRegeneratingLetter || !generatedCoverLetter}>
                      {isRegeneratingLetter ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2"/>}
                      Regenerate
                    </Button>
                    <Button variant="secondary" onClick={handleSaveLetter} disabled={isSaving || !generatedCoverLetter}>
                        {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                        Save Letter
                    </Button>
                    <DownloadButton content={generatedCoverLetter} fileName="cover-letter" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-[300px] text-xs"
                  value={isGenerating && !generatedCoverLetter ? "Generating..." : generatedCoverLetter}
                  readOnly
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
