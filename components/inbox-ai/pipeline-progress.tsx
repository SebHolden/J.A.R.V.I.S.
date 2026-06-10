"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AGENT_STEPS, type AgentStep } from "@/lib/types/pipeline";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PipelineProgress({
  currentStep,
  completedSteps,
}: {
  currentStep: AgentStep | null;
  completedSteps: AgentStep[];
}) {
  const progress = Math.round(
    ((completedSteps.length + (currentStep ? 0.5 : 0)) / AGENT_STEPS.length) * 100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI agents at work</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="space-y-3">
          {AGENT_STEPS.map((step) => {
            const done = completedSteps.includes(step.id);
            const active = currentStep === step.id;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 text-sm",
                  done && "text-emerald-600",
                  active && "font-medium text-slate-900",
                  !done && !active && "text-slate-400"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {step.label}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
