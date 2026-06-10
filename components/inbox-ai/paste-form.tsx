"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineProgress } from "./pipeline-progress";
import type { AgentStep } from "@/lib/types/pipeline";

const DEMO_REQUESTS = [
  "Buongiorno, vorremmo adattare la vetrofania di Legnano per la sede di Bergamo.",
  "Serve il flyer della campagna prevenzione aggiornato con le nuove date.",
];

export function PasteForm() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<AgentStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<AgentStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setCompletedSteps([]);
    setCurrentStep("intake");

    const stepOrder: AgentStep[] = ["intake", "memory", "learning", "account", "quality", "executive"];
    const stepInterval = setInterval(() => {
      setCompletedSteps((prev) => {
        const next = stepOrder.find((s) => !prev.includes(s) && s !== currentStep);
        if (next) {
          setCurrentStep(next);
          return [...prev, ...(prev.length === 0 ? ["intake" as AgentStep] : [])];
        }
        return prev;
      });
    }, 2000);

    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: input }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Pipeline failed");
      }

      const data = await res.json();
      setCompletedSteps(stepOrder);
      setCurrentStep("executive");
      router.push(`/approval-inbox/${data.inbox_item_id}`);
    } catch (e) {
      clearInterval(stepInterval);
      setError(e instanceof Error ? e.message : "Analysis failed");
      setCurrentStep(null);
      setCompletedSteps([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paste client request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste an email or client request here..."
            rows={8}
            className="text-base"
          />

          <div className="flex flex-wrap gap-2">
            {DEMO_REQUESTS.map((demo) => (
              <Button
                key={demo}
                variant="outline"
                size="sm"
                onClick={() => setInput(demo)}
                className="h-auto whitespace-normal text-left text-xs"
              >
                {demo}
              </Button>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button onClick={handleAnalyze} disabled={loading || !input.trim()} size="lg">
            {loading ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <PipelineProgress currentStep={currentStep} completedSteps={completedSteps} />
      )}
    </div>
  );
}
