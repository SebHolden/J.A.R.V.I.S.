import { cn } from "@/lib/utils";
import { HeroBanner } from "./hero-banner";

export function PageHeader({
  title,
  description,
  children,
  hero = false,
  accent = "default",
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  hero?: boolean;
  accent?: "default" | "purple" | "cyan" | "warm";
}) {
  if (hero) {
    return (
      <HeroBanner title={title} description={description} accent={accent}>
        {children}
      </HeroBanner>
    );
  }

  return (
    <div className="mb-8 flex animate-fade-in-up items-start justify-between gap-4">
      <div>
        <h1 className="stripe-heading text-2xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function AnimatedGrid({
  children,
  className,
  cols = 4,
}: {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "animate-stagger-children grid gap-4",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-1 md:grid-cols-3",
        cols === 4 && "grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={cn("animate-fade-in-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}
