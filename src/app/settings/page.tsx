
'use client';
import { deleteUserAccount } from "@/app/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Nav } from "@/components/nav";


export default function SettingsPage() {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const storedName = localStorage.getItem('fitletter_user_name');
        const storedEmail = localStorage.getItem('fitletter_user_email');
        const storedId = localStorage.getItem('fitletter_user_id');
        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
        if (storedId) setUserId(parseInt(storedId));
    }, []);

    const handleDeleteAccount = () => {
        if (!userId) return;
        startTransition(async () => {
            const { error } = await deleteUserAccount(userId);
            if (error) {
                toast({ title: 'Error', description: 'Failed to delete account.', variant: 'destructive'});
            } else {
                toast({ title: 'Success', description: 'Your account has been deleted.' });
                handleLogout();
            }
            setIsDeleteDialogOpen(false);
        });
    };

    const handleSave = () => {
        // Here you would typically call a server action to update user details
        // For now, we just update localStorage for a persistent demo effect
        localStorage.setItem('fitletter_user_name', name);
        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' });
        } catch (_) {}
        try {
            localStorage.removeItem('fitletter_user_email');
            localStorage.removeItem('fitletter_user_id');
            localStorage.removeItem('fitletter_user_name');
        } catch (_) {}
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/');
        router.refresh();
    }

    return (
        <div className="min-h-screen w-full bg-background/50">
          <main className="container mx-auto flex flex-col p-4 sm:p-8">
            <header className="mb-8 flex items-center justify-between">
              <Nav />
            </header>
            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User/> Profile Settings</CardTitle>
                        <CardDescription>Manage your account and personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-md">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSave}>Save Changes</Button>
                            <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2"/>Log Out</Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Resume Parsing Defaults</CardTitle>
                        <CardDescription>Set default information to be used when creating new resumes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-md">
                        <div className="grid gap-2">
                            <Label>Default Skills</Label>
                            <Textarea placeholder="JavaScript, React, Node.js..." />
                        </div>
                        <div className="grid gap-2">
                            <Label>Default Summary</Label>
                            <Textarea placeholder="Experienced software engineer..." />
                        </div>
                         <Button onClick={handleSave}>Save Defaults</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Notification Settings</CardTitle>
                        <CardDescription>Manage how you receive notifications about your applications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Notification settings would go here */}
                         <p className="text-muted-foreground">Notification settings are not yet available.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>These actions are irreversible. Please be certain.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>Delete Account</Button>
                    </CardContent>
                </Card>
            </div>
          </main>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and all associated data from our servers.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 animate-spin" />}
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
    )
}
