import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getClients, getMaterialsWithVersions } from "@/lib/db/queries";
import { UploadForm } from "@/components/materials/upload-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  internal_review: "bg-blue-100 text-blue-700",
  client_review: "bg-purple-100 text-purple-700",
  approved: "bg-emerald-100 text-emerald-700",
  production: "bg-indigo-100 text-indigo-700",
  archived: "bg-slate-100 text-slate-500",
};

export default async function MaterialsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const materials = await getMaterialsWithVersions(supabase, user.agency_id);
  const clients = await getClients(supabase, user.agency_id);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, client_id, title")
    .in("client_id", clients.map((c) => c.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Material Vault</h1>
        <p className="mt-1 text-slate-500">
          Structured file archive. Version and status determine which file is current — never trust filenames.
        </p>
      </div>

      <UploadForm clients={clients} projects={projects ?? []} />

      <div className="space-y-4">
        {materials.map((m: {
          id: string;
          title: string;
          file_type: string;
          clients?: { name: string };
          projects?: { title: string };
          versions: { id: string; version_number: number; status: string; notes: string | null }[];
        }) => (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{m.title}</CardTitle>
                <Badge variant="outline">{m.file_type}</Badge>
              </div>
              <p className="text-sm text-slate-500">
                {m.clients?.name}
                {m.projects?.title && ` · ${m.projects.title}`}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {m.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-sm">
                    <span>v{v.version_number}</span>
                    <Badge className={statusColors[v.status] ?? ""}>{v.status}</Badge>
                    {v.notes && <span className="text-slate-500 truncate max-w-xs">{v.notes}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
