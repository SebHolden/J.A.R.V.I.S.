import { PasteForm } from "@/components/inbox-ai/paste-form";
import { PageHeader } from "@/components/layout/page-header";

export default function InboxAIPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        hero
        accent="purple"
        title="Inbox AI"
        description="Paste a client email or request. AI agents will extract intent, retrieve context, generate a reply and brief, then queue it for your approval."
      />
      <PasteForm />
    </div>
  );
}
