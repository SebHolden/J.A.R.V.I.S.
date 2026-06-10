import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Active and completed client projects." />

      <div className="grid gap-4">
        {(projects ?? []).map((p: {
          id: string;
          title: string;
          status: string;
          deadline: string | null;
          description: string | null;
          clients: { name: string };
        }) => (
          <Card key={p.id} className="stripe-card border-0 ring-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <Badge variant="outline">{p.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{p.clients?.name}</p>
            </CardHeader>
            {p.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                {p.deadline && (
                  <p className="mt-2 text-xs text-muted-foreground">Deadline: {p.deadline}</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
