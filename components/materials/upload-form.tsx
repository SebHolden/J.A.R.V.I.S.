"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/lib/types/database";

const FILE_TYPES = ["vetrofania", "flyer", "social", "brochure", "logo", "video", "other"];

export function UploadForm({
  clients,
  projects,
}: {
  clients: Client[];
  projects: { id: string; client_id: string; title: string }[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => p.client_id === clientId);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !clientId || !title || !fileType) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId);
    if (projectId) formData.append("project_id", projectId);
    formData.append("title", title);
    formData.append("file_type", fileType);

    try {
      const res = await fetch("/api/materials/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
      setTitle("");
      setFile(null);
      setClientId("");
      setProjectId("");
      setFileType("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload material</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")} disabled={!clientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>File type *</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>File *</Label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
