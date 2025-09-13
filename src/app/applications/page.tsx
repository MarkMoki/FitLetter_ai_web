
'use client';
import {
  addApplication,
  autofillJobDetailsAction,
  deleteApplication,
  getApplicationsForUser,
  updateApplicationStatus,
} from '@/app/actions';
import { Nav } from '@/components/nav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { Application } from '@/db/schema';
import { format } from 'date-fns';
import {
  Briefcase,
  Loader2,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Wand2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const statusOptions: StatusColumn[] = [
  'Saved',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
];
type StatusColumn = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

const statusColors: Record<StatusColumn, string> = {
  Saved: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  Applied: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  Interviewing: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  Offer: 'bg-green-500/20 text-green-700 dark:text-green-400',
  Rejected: 'bg-red-500/20 text-red-700 dark:text-red-400',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedId = localStorage.getItem('fitletter_user_id');
    if (!storedId) {
      router.push('/');
      return;
    }
    const id = parseInt(storedId);
    setUserId(id);

    async function loadData() {
      setIsLoading(true);
      const { data, error } = await getApplicationsForUser(id);
      if (error) {
        toast({
          title: 'Error loading applications',
          description: error,
          variant: 'destructive',
        });
      } else if (data) {
        setApplications(data);
      }
      setIsLoading(false);
    }
    loadData();
  }, [router]);

  const handleStatusChange = async (id: number, status: string) => {
    const { error } = await updateApplicationStatus(id, status);
    if (error) {
      toast({
        title: 'Error updating status',
        description: error,
        variant: 'destructive',
      });
    } else {
      setApplications(
        applications.map((app) => (app.id === id ? { ...app, status } : app))
      );
      toast({
        title: 'Status Updated',
        description: 'The application status has been updated.',
      });
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await deleteApplication(id);
    if (error) {
      toast({
        title: 'Error deleting application',
        description: error,
        variant: 'destructive',
      });
    } else {
      setApplications(applications.filter((app) => app.id !== id));
      toast({
        title: 'Application Deleted',
        description: 'The application has been removed.',
      });
    }
  };

  const handleApplicationAdded = (newApplication: Application) => {
    setApplications([newApplication, ...applications]);
  };

  return (
    <div className="min-h-screen w-full bg-background/50">
      <main className="container mx-auto flex flex-col p-4 sm:p-8">
        <header className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Nav />
          <AddApplicationDialog onApplicationAdded={handleApplicationAdded} userId={userId}>
            <Button
              className="animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <PlusCircle className="mr-2" />
              Add Application
            </Button>
          </AddApplicationDialog>
        </header>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase />
              Job Application Tracker
            </CardTitle>
            <CardDescription>
              Manage all your job applications in one place.
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Requirements</TableHead>
                      <TableHead className="hidden md:table-cell">Date Added</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length > 0 ? applications.map((app) => (
                      <ApplicationRow
                        key={app.id}
                        application={app}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                      />
                    )) : (
                       <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No applications found.
                             <AddApplicationDialog onApplicationAdded={handleApplicationAdded} userId={userId}>
                              <Button variant="link">Add one now</Button>
                            </AddApplicationDialog>
                          </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function ApplicationRow({
  application,
  onStatusChange,
  onDelete,
}: {
  application: Application;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{application.jobTitle}</TableCell>
        <TableCell>{application.company}</TableCell>
        <TableCell>
            {application.requirements ? (
                 <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">View</Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap max-w-xs">{application.requirements}</div>
                    </CollapsibleContent>
                 </Collapsible>
            ) : (
                <span className="text-muted-foreground">N/A</span>
            )}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {application.createdAt ? format(new Date(application.createdAt * 1000), 'PP') : 'N/A'}
        </TableCell>
        <TableCell>
          <Select
            value={application.status}
            onValueChange={(status) => onStatusChange(application.id, status)}
          >
            <SelectTrigger
              className={cn(`w-36 border-0 text-xs font-semibold`, statusColors[application.status as StatusColumn])}
            >
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  <Badge
                    className={cn(`mr-2 hover:bg-inherit`, statusColors[status as StatusColumn])}
                  >
                    {status}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          {application.url ? (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Link
            </a>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              application entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(application.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddApplicationDialog({
  children,
  onApplicationAdded,
  userId
}: {
  children: React.ReactNode;
  onApplicationAdded: (app: Application) => void;
  userId: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [jobPostingText, setJobPostingText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState<StatusColumn>('Saved');

  const resetForm = () => {
      setJobTitle('');
      setCompany('');
      setUrl('');
      setRequirements('');
      setStatus('Saved');
      setJobPostingText('');
  }

  const handleSubmit = async () => {
    if (!jobTitle || !company) {
      toast({
        title: 'Missing information',
        description: 'Please fill out the job title and company.',
        variant: 'destructive',
      });
      return;
    }
     if (!userId) {
      toast({
        title: 'User not found',
        description: 'You must be logged in to add an application.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    const { data, error } = await addApplication({
      jobTitle,
      company,
      url,
      requirements,
      status,
      userId,
    });
    if (error) {
      toast({
        title: 'Error adding application',
        description: error,
        variant: 'destructive',
      });
    } else if (data) {
      toast({
        title: 'Application Added',
        description: 'The new application has been saved.',
      });
      onApplicationAdded(data);
      setIsOpen(false);
      resetForm();
    }
    setIsLoading(false);
  };
  
    const handleAutofill = async () => {
    if (!jobPostingText) return;
    setIsAutofilling(true);
    const { data, error } = await autofillJobDetailsAction({ jobPostingText });
    if (data) {
        if(data.jobTitle) setJobTitle(data.jobTitle);
        if(data.companyName) setCompany(data.companyName);
        if(data.url) setUrl(data.url);
        if(data.requirements) setRequirements(data.requirements);
        toast({ title: 'Success', description: 'Job details have been autofilled.'});
    } else {
        toast({ title: 'Autofill Failed', description: error, variant: 'destructive' });
    }
    setIsAutofilling(false);
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Application</DialogTitle>
          <DialogDescription>
            Track a new job application. You can paste a link or job posting to autofill details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="job-posting-text">Autofill from Posting or Link</Label>
                 <Textarea 
                    id="job-posting-text"
                    placeholder="Paste a share link (e.g., from LinkedIn) or the full job posting text here..."
                    className="min-h-[80px]"
                    value={jobPostingText}
                    onChange={(e) => setJobPostingText(e.target.value)}
                />
                <Button onClick={handleAutofill} disabled={isAutofilling || !jobPostingText} variant="secondary">
                    {isAutofilling ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                    Autofill Details
                </Button>
            </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Inc."
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">Application URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/job-posting"
            />
          </div>
           <div className="grid gap-2">
              <Label htmlFor="requirements">Key Requirements</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Key skills and qualifications will appear here after autofill..."
                className="min-h-[100px]"
              />
            </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(s) => setStatus(s as StatusColumn)}>
              <SelectTrigger>
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 animate-spin" />}
            Save Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
