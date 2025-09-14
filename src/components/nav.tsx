
'use client';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, Briefcase, FileText, LayoutDashboard, LogOut, Menu, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState, useTransition } from "react";
import { toast } from "@/hooks/use-toast";

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/applications', icon: Briefcase, label: 'Applications' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/resumes', icon: FileText, label: 'Resumes' },
    { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  }

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/signout', {
          method: 'POST',
        });

        if (response.ok) {
          try {
            localStorage.removeItem('fitletter_user_email');
            localStorage.removeItem('fitletter_user_id');
            localStorage.removeItem('fitletter_user_name');
          } catch (_) {}
          toast({
            title: 'Signed Out',
            description: 'You have been signed out successfully.',
          });
          router.push('/login');
          router.refresh();
        } else {
          throw new Error('Sign out failed');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to sign out. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  const NavContent = () => (
    <div className="flex flex-col gap-2 p-2 md:flex-row md:gap-1 md:rounded-lg md:border md:bg-background md:p-1 md:items-center">
      {navItems.map(item => (
        <Button
          key={item.href}
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation(item.href)}
          className={cn(
            "w-full justify-start text-base md:text-sm",
            pathname === item.href && "bg-muted font-semibold"
          )}
        >
          <item.icon className="mr-2" />
          {item.label}
        </Button>
      ))}
      <div className="md:ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isPending}
          className="w-full justify-start text-base md:text-sm text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <nav className="flex w-full items-center gap-4 md:w-auto">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="font-headline text-2xl font-bold tracking-tight">
          FitLetter
        </h1>
      </div>
      
      {isDesktop ? (
        <NavContent />
      ) : (
        <div className="ml-auto">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                </SheetHeader>
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      )}
    </nav>
  );
}
