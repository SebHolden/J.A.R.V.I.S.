"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  Briefcase,
  FileText,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  LogOut,
  Radar,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const mainNav = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/approval-inbox", label: "Approval Inbox", icon: Inbox },
  { href: "/inbox-ai", label: "Inbox AI", icon: Sparkles },
  { href: "/radar", label: "Daily Radar", icon: Radar },
  { href: "/brain", label: "Agency Brain", icon: Brain },
];

const secondaryNav = [
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/materials", label: "Materials", icon: FolderOpen },
  { href: "/briefs", label: "Briefs", icon: FileText },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-accent text-accent-foreground shadow-[inset_3px_0_0_0_var(--primary)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {label}
    </Link>
  );
}

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-5 py-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="stripe-logo-glow flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-foreground">AgencyPilot</div>
              <div className="text-xs text-muted-foreground">Publitrust</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {mainNav.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <Separator className="my-3" />

        {secondaryNav.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}

        <Separator className="my-3" />

        <NavLink href="/settings" label="Settings" icon={Settings} active={isActive("/settings")} />
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 truncate text-sm font-medium text-foreground">{userName}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
