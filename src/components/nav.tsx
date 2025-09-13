
'use client';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, Briefcase, FileText, LayoutDashboard, Menu, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";

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

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  }

  const NavContent = () => (
    <div className="flex flex-col gap-2 p-2 md:flex-row md:gap-1 md:rounded-lg md:border md:bg-background md:p-1">
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
