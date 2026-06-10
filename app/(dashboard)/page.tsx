import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getApprovalInboxItems, getCommandCenterStats } from "@/lib/db/queries";
import { StatsCard } from "@/components/layout/stats-card";
import { InboxItemCard } from "@/components/approval-inbox/inbox-item-card";
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {greeting}, {user.name}.
          </h1>
          <p className="mt-1 text-slate-500">
            Jarvis handled {stats.handledToday} items today.{" "}
            {stats.pendingApprovals} approval{stats.pendingApprovals !== 1 ? "s" : ""} waiting for you.
          </p>
        </div>
        <Link href="/inbox-ai">
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            New request
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Approvals waiting"
          value={stats.pendingApprovals}
          variant={stats.pendingApprovals > 0 ? "warning" : "default"}
        />
        <StatsCard label="Risks detected" value={stats.risks} variant={stats.risks > 0 ? "warning" : "default"} />
        <StatsCard label="Handled today" value={stats.handledToday} variant="success" />
        <StatsCard label="Approval rate (30d)" value={`${stats.approvalRate}%`} subtext="Last 30 days" />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">Approvals</h2>
          <Link href="/approval-inbox" className="text-sm text-slate-500 hover:text-slate-700">
            View all →
          </Link>
        </div>
        {pendingItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500">
            <p>No approvals waiting. Paste a client request in Inbox AI to get started.</p>
            <Link href="/inbox-ai">
              <Button variant="outline" className="mt-4">Open Inbox AI</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingItems.slice(0, 10).map((item) => (
              <InboxItemCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </section>

      {riskItems.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-medium text-slate-900">Risks</h2>
          <div className="space-y-3">
            {riskItems.map((item) => (
              <InboxItemCard key={item.id} item={item} compact />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-medium text-slate-900">Daily Radar</h2>
        <p className="mt-2 text-sm text-slate-500">
          Daily Radar — coming in Sprint 4. Automated morning scan for overdue tasks,
          blocked projects, and inactive clients.
        </p>
      </section>
    </div>
  );
}
