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

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-slate-100">
      <div className="px-5 py-6">
        <div className="text-lg font-semibold tracking-tight">AgencyPilot</div>
        <div className="mt-1 text-xs text-slate-400">Publitrust</div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {mainNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3 bg-slate-700" />

        {secondaryNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3 bg-slate-700" />

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 text-sm text-slate-300">{userName}</div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
