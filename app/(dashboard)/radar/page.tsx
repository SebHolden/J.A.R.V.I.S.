import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Daily Radar" description="Morning priority scan — coming in Sprint 4." />

      <div className="grid gap-4 md:grid-cols-2">
        {["Critical", "At risk", "Blocked", "Waiting approval", "Inactive clients", "Ready to send"].map(
          (section) => (
            <Card key={section} className="stripe-card border-0 opacity-60 ring-0">
              <CardHeader>
                <CardTitle className="text-base">{section}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Automated scan not yet enabled.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
