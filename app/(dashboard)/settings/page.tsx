import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { data: policies } = await supabase
    .from("autonomy_policies")
    .select("*")
    .eq("agency_id", user.agency_id);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Agency configuration and autonomy policies." />

      <Card className="stripe-card border-0 ring-0">
        <CardHeader>
          <CardTitle className="text-base">Autonomy policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All autonomous actions are disabled by default. Enable in Sprint 5.
          </p>
          {(policies ?? []).map((p: { id: string; action_type: string; policy: string; enabled: boolean }) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{p.action_type.replace(/_/g, " ")}</span>
              <div className="flex gap-2">
                <Badge variant="outline">{p.policy.replace(/_/g, " ")}</Badge>
                <Badge className={p.enabled ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
                  {p.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
