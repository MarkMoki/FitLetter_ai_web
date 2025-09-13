
'use client';

import {
  FileText,
  PlusCircle,
  Briefcase,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  History,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Resume, Letter, Application } from '@/db/schema';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from './ui/chart';
import { BarChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Bar } from 'recharts';
import { Nav } from './nav';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { deleteLetter } from '@/app/actions';


type ResumeWithStringDate = Omit<Resume, 'createdAt' | 'updatedAt'> & { createdAt: string, updatedAt: string | null };
type LetterWithStringDate = Omit<Letter, 'createdAt'> & { createdAt: string };

interface DashboardProps {
  resumes: ResumeWithStringDate[];
  letters: LetterWithStringDate[];
  applications: Application[];
}

export function Dashboard({ resumes: initialResumes, letters: initialLetters, applications: initialApplications }: DashboardProps) {
  const router = useRouter();
  const [letters, setLetters] = useState(initialLetters);
  const [resumes, setResumes] = useState(initialResumes);
  const [applications, setApplications] = useState(initialApplications);


  const handleCreateNew = () => {
    router.push('/editor/new');
  };

  const handleManageResumes = () => {
    router.push('/resumes');
  };

  const handleEditLetter = (id: number) => {
    router.push(`/editor/${id}`);
  };

  const handleDeleteLetter = async (id: number) => {
    const { error } = await deleteLetter(id);
    if (error) {
        toast({ title: 'Error deleting letter', description: error, variant: 'destructive' });
    } else {
        toast({ title: 'Success', description: 'Cover letter deleted.' });
        setLetters(letters.filter(l => l.id !== id));
    }
  }

  const atsScores = letters?.map(l => l.atsScore).filter(Boolean) as number[] || [];
  const averageAtsScore = atsScores.length > 0 ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : 0;
  const maxAtsScore = atsScores.length > 0 ? Math.max(...atsScores) : 0;
  
  const funnelData = [
    { name: 'Resumes', value: resumes?.length || 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Letters', value: letters?.length || 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Apps', value: applications?.length || 0, fill: 'hsl(var(--chart-3))' },
  ];

  return (
     <div className="min-h-screen w-full bg-background/50">
      <main className="container mx-auto flex flex-col p-4 sm:p-8">
         <header className="mb-8 flex items-center justify-between">
          <Nav />
        </header>

        <div className="grid gap-8">
      <Card className="animate-fade-in-up">
        <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>
              You have {resumes.length} resumes and {letters.length} cover
              letters. Ready to land your next job?
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateNew} size="lg" className="font-bold animate-button-lift">
              <PlusCircle className="mr-2" />
              Create New Application
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Card className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><TrendingUp />Application Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.some(d => d.value > 0) ? (
                <ChartContainer config={{}} className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={funnelData} margin={{left: 10, right: 40}}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="value" radius={4} layout="vertical" label={{ position: 'right', offset: 8, className: "fill-foreground font-semibold" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-muted-foreground">
                  No activity yet.
                </div>
              )}
            </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Target/>ATS Score Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
              {atsScores && atsScores.length > 0 ? (
                <>
                  <div className="flex flex-col items-center justify-center space-y-2">
                      <h3 className='text-sm font-medium'>Average Score</h3>
                      <AtsScoreChart score={averageAtsScore} />
                  </div>
                  <div className="flex flex-col items-center justify-center space-y-2">
                      <h3 className='text-sm font-medium'>Highest Score</h3>
                      <AtsScoreChart score={maxAtsScore} />
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex h-36 items-center justify-center text-muted-foreground">
                    No scores yet.
                </div>
              )}
            </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><History/>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='space-y-4'>
                    {letters && letters.length > 0 ? letters.slice(0,3).map(letter => (
                        <div key={letter.id} className='flex items-center justify-between'>
                            <div>
                                <p className='font-medium'>{letter.jobTitle}</p>
                                <p className='text-sm text-muted-foreground'>{letter.company}</p>
                            </div>
                            <Badge variant="outline">{letter.createdAt}</Badge>
                        </div>
                    )) : <p className="text-muted-foreground text-center">No letters created yet.</p>}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="animate-fade-in-up" style={{animationDelay: '0.5s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText />
              My Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumes.length > 0 ? resumes.map((resume) => (
                  <TableRow
                    key={resume.id}
                    onClick={handleManageResumes}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{resume.title}</TableCell>
                    <TableCell>
                      {resume.createdAt}
                    </TableCell>
                  </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground h-24">No resumes created yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase />
              My Cover Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>ATS Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.length > 0 ? letters.map((letter) => (
                  <TableRow
                    key={letter.id}
                    onClick={() => handleEditLetter(letter.id)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      {letter.jobTitle}
                    </TableCell>
                    <TableCell>{letter.company}</TableCell>
                    <TableCell>
                      {letter.atsScore ? (
                        <Badge variant={letter.atsScore > 85 ? 'default' : 'secondary'}>{letter.atsScore}%</Badge>
                      ) : (
                        <Badge variant="outline">N/A</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {letter.createdAt}
                    </TableCell>
                    <TableCell>
                      <DocumentActions
                        onEdit={() => handleEditLetter(letter.id)}
                        onConfirmDelete={() => handleDeleteLetter(letter.id)}
                      />
                    </TableCell>
                  </TableRow>
                )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No cover letters created yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
    </main>
    </div>
  );
}

const DocumentActions = ({ onEdit, onConfirmDelete }: { onEdit: () => void, onConfirmDelete: () => void }) => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onEdit}>
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
                This action cannot be undone. This will permanently delete this cover letter.
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
};

const AtsScoreChart = ({ score }: { score: number }) => {
  const chartData = [
    { name: 'score', value: score, fill: 'hsl(var(--primary))' },
    { name: 'empty', value: 100 - score, fill: 'hsl(var(--muted))' }
  ];
  const chartConfig = {
    score: {
      label: 'ATS Score',
    },
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-20 w-20"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel indicator="dot" />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={24}
          strokeWidth={2}
          outerRadius={32}
          startAngle={90}
          endAngle={450}
        >
        </Pie>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-xl font-semibold"
        >
          {score}%
        </text>
      </PieChart>
    </ChartContainer>
  );
};

    
