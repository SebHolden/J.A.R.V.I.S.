import { cn } from "@/lib/utils";

export function HeroBanner({
  title,
  description,
  children,
  className,
  accent = "default",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  accent?: "default" | "purple" | "cyan" | "warm";
}) {
  return (
    <div
      className={cn(
        "stripe-hero relative overflow-hidden rounded-2xl px-8 py-10 animate-fade-in-up",
        accent === "purple" && "stripe-hero-purple",
        accent === "cyan" && "stripe-hero-cyan",
        accent === "warm" && "stripe-hero-warm",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="stripe-orb stripe-orb-1" />
        <div className="stripe-orb stripe-orb-2" />
        <div className="stripe-orb stripe-orb-3" />
        <div className="stripe-hero-grid" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="stripe-heading stripe-gradient-text text-3xl md:text-4xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>
          )}
        </div>
        {children && <div className="shrink-0 animate-fade-in-up animation-delay-200">{children}</div>}
      </div>
    </div>
  );
}
