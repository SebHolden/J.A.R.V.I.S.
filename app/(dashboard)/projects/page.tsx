import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Projects</h1>
        <p className="mt-1 text-slate-500">Active and completed client projects.</p>
      </div>

      <div className="grid gap-4">
        {(projects ?? []).map((p: {
          id: string;
          title: string;
          status: string;
          deadline: string | null;
          description: string | null;
          clients: { name: string };
        }) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.title}</CardTitle>
                <Badge variant="outline">{p.status}</Badge>
              </div>
              <p className="text-sm text-slate-500">{p.clients?.name}</p>
            </CardHeader>
            {p.description && (
              <CardContent>
                <p className="text-sm text-slate-600">{p.description}</p>
                {p.deadline && (
                  <p className="mt-2 text-xs text-slate-400">Deadline: {p.deadline}</p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
