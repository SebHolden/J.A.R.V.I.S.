import { BrainSearch } from "@/components/brain/brain-search";
import { PageHeader } from "@/components/layout/page-header";
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
        <PageHeader title="Agency Brain" description="Agency Brain non è abilitato per la tua agenzia." />
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
      <PageHeader
        hero
        accent="cyan"
        title="Agency Brain"
        description="Ricerca conversazionale su tutti i dati dell'agenzia — sempre con fonti citate."
      />
      <BrainSearch clients={clients ?? []} />
    </div>
  );
}
