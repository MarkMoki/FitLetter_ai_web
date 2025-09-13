
'use client';
import { getApplicationsForUser, getLettersForUser } from "@/app/actions";
import { Briefcase, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie } from "recharts";
import { useEffect, useState } from "react";
import { Application, Letter } from "@/db/schema";
import { format } from "date-fns";
import { Nav } from "@/components/nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

type LetterWithDate = Omit<Letter, "createdAt"> & { createdAt: Date | null };


export default function AnalyticsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [letters, setLetters] = useState<LetterWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [userId, setUserId] = useState<number|null>(null);

  useEffect(() => {
     const storedId = localStorage.getItem('fitletter_user_id');
    if (!storedId) {
      router.push('/');
      return;
    }
    const id = parseInt(storedId);
    setUserId(id);

    async function loadData() {
        setLoading(true);
        const [{data: appData}, {data: letterData}] = await Promise.all([
            getApplicationsForUser(id), 
            getLettersForUser(id)
        ]);

        if (appData) {
            setApplications(appData.map(a => ({...a, createdAt: a.createdAt ? new Date(a.createdAt * 1000) : null } as any)));
        }
        
        if (letterData) {
            setLetters(letterData as LetterWithDate[]);
        }

        setLoading(false);
    }
    loadData();
  }, [router])

  const atsScoreData = letters
    .filter(l => l.atsScore && l.createdAt)
    .sort((a,b) => a.createdAt!.getTime() - b.createdAt!.getTime())
    .map(l => ({
      date: format(l.createdAt!, 'MMM d'),
      score: l.atsScore,
  }));

  const statusData = statusColumns.map(status => ({
      name: status,
      value: applications.filter(app => app.status === status).length,
      fill: `hsl(var(--chart-${statusColumns.indexOf(status) + 1}))`
  })).filter(s => s.value > 0);
  

    const applicationHistory = applications.map(app => ({
      ...app,
      date: app.createdAt ? format(new Date(app.createdAt), 'PP') : 'N/A'
    }));

    if(loading) {
        return (
            <div className="min-h-screen w-full bg-background/50">
              <main className="container mx-auto flex flex-col p-4 sm:p-8">
                <header className="mb-8 flex items-center justify-between">
                  <Nav />
                </header>
                <div className="grid gap-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-64 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-64 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                             <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
                </div>
              </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-background/50">
          <main className="container mx-auto flex flex-col p-4 sm:p-8">
            <header className="mb-8 flex items-center justify-between">
              <Nav />
            </header>
            <div className="grid gap-8">
                {/* Top Row */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <Card className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Target /> ATS Score Over Time</CardTitle>
                            <CardDescription>Track the improvement of your resume's ATS score.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {atsScoreData.length > 0 ? (
                                <ChartContainer config={{score: {label: 'Score', color: 'hsl(var(--primary))'}}} className="h-64 w-full">
                                    <ResponsiveContainer>
                                        <LineChart data={atsScoreData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))'}}/>
                                            <Legend />
                                            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                <div className="flex h-64 items-center justify-center text-muted-foreground">
                                    No ATS scores to display yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Briefcase/> Application Status Breakdown</CardTitle>
                             <CardDescription>Visualize the current status of your applications.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statusData.length > 0 ? (
                                <ChartContainer config={{}} className="h-64 w-full">
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                 <div className="flex h-64 items-center justify-center text-muted-foreground">
                                    No application statuses to display yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row */}
                <Card className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Calendar /> Full Application History</CardTitle>
                        <CardDescription>A detailed log of all your tracked applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applicationHistory.length > 0 ? applicationHistory.map(app => (
                                    <TableRow key={app.id}>
                                        <TableCell className="font-medium">{app.jobTitle}</TableCell>
                                        <TableCell>{app.company}</TableCell>
                                        <TableCell>{app.date}</TableCell>
                                        <TableCell>{app.status}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No applications added yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </main>
        </div>
    )
}

const statusColumns: StatusColumn[] = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
type StatusColumn = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
