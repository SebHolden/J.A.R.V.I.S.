import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getClients } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const clients = await getClients(supabase, user.agency_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clients</h1>
        <p className="mt-1 text-slate-500">Client memory and relationship overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <Badge variant="outline">{client.sector}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-slate-500">{client.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
