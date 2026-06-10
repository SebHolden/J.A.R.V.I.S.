"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BrainAnswer } from "@/lib/types/pipeline";

const SUGGESTED_QUERIES = [
  "Trova l'ultima vetrofania approvata di Bergamo",
  "Quale file ha approvato Laura?",
  "Quali materiali abbiamo usato per la campagna prevenzione?",
];

interface ClientOption {
  id: string;
  name: string;
}

export function BrainSearch({ clients }: { clients: ClientOption[] }) {
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<BrainAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedWhy, setExpandedWhy] = useState(false);

  async function runSearch(searchQuery: string) {
    setLoading(true);
    setError(null);
    setAnswer(null);
    setExpandedWhy(false);

    try {
      const res = await fetch("/api/brain/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          client_id: clientId === "all" ? undefined : clientId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setAnswer(data);
      setQuery(searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di ricerca");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1 text-base"
          placeholder="Scrivi una domanda in italiano..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && runSearch(query.trim())}
        />
        <Select value={clientId} onValueChange={(v) => setClientId(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i clienti</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => query.trim() && runSearch(query.trim())} disabled={loading}>
          {loading ? "Ricerca..." : "Cerca"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => runSearch(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          >
            {q}
          </button>
        ))}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {!answer && !loading && !error && (
        <p className="text-center text-slate-500">Inizia a cercare — scrivi una domanda in italiano.</p>
      )}

      {answer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Risposta</span>
              <span className="text-sm font-normal text-slate-500">
                Confidenza: {answer.confidence}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-800">{answer.answer}</p>

            {answer.sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Fonti</p>
                {answer.sources.map((s) => (
                  <div
                    key={s.chunk_id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-white px-2 py-0.5 text-xs text-slate-600">
                        {s.source_label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Rilevanza: {Math.round(s.relevance_score * 100)}%
                      </span>
                      <a href={s.link} className="text-xs text-blue-600 hover:underline">
                        Apri
                      </a>
                    </div>
                    <p className="mt-2 text-slate-600">{s.snippet}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpandedWhy(!expandedWhy)}
              className="text-sm text-blue-600 hover:underline"
            >
              {expandedWhy ? "Nascondi" : "Perché questo risultato?"}
            </button>

            {expandedWhy && (
              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
                <p>{answer.selection_reasoning}</p>
                {answer.alternatives_considered.length > 0 && (
                  <div>
                    <p className="font-medium">Alternative considerate:</p>
                    <ul className="mt-1 list-inside list-disc">
                      {answer.alternatives_considered.map((a) => (
                        <li key={a.chunk_id}>
                          {a.source_label} ({Math.round(a.relevance_score * 100)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
