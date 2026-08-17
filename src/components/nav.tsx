"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/login/actions";
import type { CurrentUser } from "@/lib/current-user";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Archive,
  Contact,
  Settings,
  LogOut,
} from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  salgsleder: "Salgsleder",
  selger: "Selger",
};

export function Nav({ user }: { user: CurrentUser }) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/nye-leads", label: "Nye Leads", icon: Users },
    { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
    { href: "/gamle-leads", label: "Gamle Leads", icon: Archive },
    { href: "/kunder", label: "Kunder", icon: Contact },
    ...(user.role === "administrator"
      ? [{ href: "/innstillinger", label: "Innstillinger", icon: Settings }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#17284A] backdrop-blur supports-backdrop-filter:bg-[#17284A]/95 dark:bg-background/95 dark:supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap text-white dark:text-foreground">
          RøhneSelmer{" "}
          <span className="font-normal text-white/60 dark:text-muted-foreground">LMS</span>
        </span>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white dark:bg-secondary dark:text-secondary-foreground"
                    : "text-white/65 hover:bg-white/10 hover:text-white dark:text-muted-foreground dark:hover:bg-secondary/50 dark:hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle className="text-white/80 hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground" />
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium leading-tight text-white dark:text-foreground">
              {user.name}
            </span>
            <Badge
              variant="outline"
              className="border-white/25 text-[10px] leading-none text-white/80 dark:border-border dark:text-foreground"
            >
              {ROLE_LABEL[user.role]}
            </Badge>
          </div>
          <form action={logout}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-white/80 hover:bg-white/10 hover:text-white dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground"
            >
              <LogOut className="size-4" />
              Logg ut
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
