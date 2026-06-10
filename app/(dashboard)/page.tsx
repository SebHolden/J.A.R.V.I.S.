import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getApprovalInboxItems, getCommandCenterStats } from "@/lib/db/queries";
import { StatsCard } from "@/components/layout/stats-card";
import { InboxItemCard } from "@/components/approval-inbox/inbox-item-card";
import { HeroBanner } from "@/components/layout/hero-banner";
import { AnimatedGrid, AnimatedSection } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default async function CommandCenterPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const stats = await getCommandCenterStats(supabase, user.agency_id);
  const pendingItems = await getApprovalInboxItems(supabase, user.agency_id, "pending");
  const riskItems = pendingItems.filter(
    (i) => i.quality_result === "warning" || i.quality_result === "block"
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <HeroBanner
        title={`${greeting}, ${user.name}.`}
        description={
          <>
            Jarvis handled {stats.handledToday} items today.{" "}
            {stats.pendingApprovals} approval{stats.pendingApprovals !== 1 ? "s" : ""} waiting for you.
          </>
        }
      >
        <Link href="/inbox-ai">
          <Button size="lg" className="h-10 px-5">
            <Sparkles className="mr-2 h-4 w-4" />
            New request
          </Button>
        </Link>
      </HeroBanner>

      <AnimatedGrid cols={4}>
        <StatsCard
          label="Approvals waiting"
          value={stats.pendingApprovals}
          variant={stats.pendingApprovals > 0 ? "warning" : "default"}
        />
        <StatsCard label="Risks detected" value={stats.risks} variant={stats.risks > 0 ? "warning" : "default"} />
        <StatsCard label="Handled today" value={stats.handledToday} variant="success" />
        <StatsCard label="Approval rate (30d)" value={`${stats.approvalRate}%`} subtext="Last 30 days" />
      </AnimatedGrid>

      <AnimatedSection delay={300}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Approvals</h2>
          <Link href="/approval-inbox" className="text-sm text-primary transition-colors hover:text-primary/80">
            View all →
          </Link>
        </div>
        {pendingItems.length === 0 ? (
          <div className="stripe-card rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <p>No approvals waiting. Paste a client request in Inbox AI to get started.</p>
            <Link href="/inbox-ai">
              <Button variant="outline" className="mt-4">Open Inbox AI</Button>
            </Link>
          </div>
        ) : (
          <div className="animate-stagger-children space-y-3">
            {pendingItems.slice(0, 10).map((item) => (
              <InboxItemCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </AnimatedSection>

      {riskItems.length > 0 && (
        <AnimatedSection delay={400}>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Risks</h2>
          <div className="animate-stagger-children space-y-3">
            {riskItems.map((item) => (
              <InboxItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </AnimatedSection>
      )}

      <AnimatedSection delay={500}>
        <section className="stripe-card stripe-card-hover rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground">Daily Radar</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily Radar — coming in Sprint 4. Automated morning scan for overdue tasks,
            blocked projects, and inactive clients.
          </p>
        </section>
      </AnimatedSection>
    </div>
  );
}
