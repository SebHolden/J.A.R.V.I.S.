import { PasteForm } from "@/components/inbox-ai/paste-form";

export default function InboxAIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Inbox AI</h1>
        <p className="mt-1 text-slate-500">
          Paste a client email or request. AI agents will extract intent, retrieve context,
          generate a reply and brief, then queue it for your approval.
        </p>
      </div>
      <PasteForm />
    </div>
  );
}
