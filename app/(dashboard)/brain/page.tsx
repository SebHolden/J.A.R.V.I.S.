import { BrainSearch } from "@/components/brain/brain-search";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";
import { isEnabled } from "@/lib/flags/feature-flags";
import { redirect } from "next/navigation";

export default async function BrainPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) redirect("/login");

  const enabled = await isEnabled(supabase, user.agency_id, "agency_brain");
  if (!enabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agency Brain</h1>
        <p className="text-slate-500">Agency Brain non è abilitato per la tua agenzia.</p>
      </div>
    );
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("agency_id", user.agency_id)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agency Brain</h1>
        <p className="mt-1 text-slate-500">
          Ricerca conversazionale su tutti i dati dell&apos;agenzia — sempre con fonti citate.
        </p>
      </div>
      <BrainSearch clients={clients ?? []} />
    </div>
  );
}
