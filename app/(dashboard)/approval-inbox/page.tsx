import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getApprovalInboxItems } from "@/lib/db/queries";
import { InboxItemCard } from "@/components/approval-inbox/inbox-item-card";

export default async function ApprovalInboxPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const items = await getApprovalInboxItems(supabase, user.agency_id);
  const pending = items.filter((i) => i.status === "pending");
  const resolved = items.filter((i) => i.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Approval Inbox</h1>
        <p className="mt-1 text-slate-500">
          Exceptions and decisions only — not a task list.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-slate-500">No pending approvals.</p>
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
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-400">
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
