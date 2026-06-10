"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn("relative text-muted-foreground hover:text-foreground", className)}
      onClick={toggleTheme}
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
