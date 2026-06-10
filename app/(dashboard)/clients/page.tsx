import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getClients } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export default async function ClientsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const clients = await getClients(supabase, user.agency_id);

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Client memory and relationship overview." />

      <div className="grid gap-4 md:grid-cols-2">
        {clients.map((client) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="stripe-card-hover border-0 shadow-[var(--shadow-stripe)] ring-0 hover:shadow-[var(--shadow-stripe-lg)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <Badge variant="outline">{client.sector}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{client.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
