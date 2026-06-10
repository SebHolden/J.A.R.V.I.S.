import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Daily Radar</h1>
        <p className="mt-1 text-slate-500">Morning priority scan — coming in Sprint 4.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {["Critical", "At risk", "Blocked", "Waiting approval", "Inactive clients", "Ready to send"].map(
          (section) => (
            <Card key={section} className="opacity-60">
              <CardHeader>
                <CardTitle className="text-base">{section}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">Automated scan not yet enabled.</p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
