import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getClientById } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { client, contacts, projects } = await getClientById(supabase, id);
  if (!client || client.agency_id !== user.agency_id) notFound();

  const guidelines = client.brand_guidelines as {
    tone?: string;
    logo?: string;
    notes?: string;
    colors?: Record<string, string>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{client.name}</h1>
        <p className="mt-1 text-slate-500">{client.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-slate-500">{c.role} · {c.email}</div>
                {c.notes && <div className="mt-1 text-slate-600">{c.notes}</div>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brand guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {guidelines.tone && <div><span className="font-medium">Tone:</span> {guidelines.tone}</div>}
            {guidelines.logo && <div><span className="font-medium">Logo:</span> {guidelines.logo}</div>}
            {guidelines.notes && <div><span className="font-medium">Notes:</span> {guidelines.notes}</div>}
            {guidelines.colors && (
              <div className="flex gap-2 mt-2">
                {Object.entries(guidelines.colors).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: v }} />
                    <span className="text-xs text-slate-500">{k}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Active projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    {p.deadline && <div className="text-slate-500">Due: {p.deadline}</div>}
                  </div>
                  <Badge variant="outline">{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
