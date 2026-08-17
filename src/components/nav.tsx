"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
          RøhneSelmer <span className="text-muted-foreground font-normal">LMS</span>
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
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium leading-tight">{user.name}</span>
            <Badge variant="outline" className="text-[10px] leading-none">
              {ROLE_LABEL[user.role]}
            </Badge>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" />
              Logg ut
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
