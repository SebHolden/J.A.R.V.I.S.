import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getApprovalInboxItems } from "@/lib/db/queries";
import { InboxItemCard } from "@/components/approval-inbox/inbox-item-card";
import { PageHeader } from "@/components/layout/page-header";

export default async function ApprovalInboxPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const items = await getApprovalInboxItems(supabase, user.agency_id);
  const pending = items.filter((i) => i.status === "pending");
  const resolved = items.filter((i) => i.status !== "pending");

  return (
    <div className="space-y-8">
      <PageHeader
        hero
        title="Approval Inbox"
        description="Exceptions and decisions only — not a task list."
      />

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground">No pending approvals.</p>
        ) : (
          <div className="grid gap-4">
            {pending.map((item) => (
              <InboxItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resolved ({resolved.length})
          </h2>
          <div className="grid gap-4 opacity-75">
            {resolved.map((item) => (
              <InboxItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
