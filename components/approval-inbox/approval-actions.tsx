"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ApprovalInboxItem } from "@/lib/types/database";

export function ApprovalActions({ item }: { item: ApprovalInboxItem }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editedReply, setEditedReply] = useState(item.reply_draft ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading("approve");
    setError(null);
    try {
      const res = await fetch(`/api/approval-inbox/${item.id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/approval-inbox");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setLoading(null);
    }
  }

  async function handleEdit() {
    setLoading("edit");
    setError(null);
    const diff = item.reply_draft !== editedReply
      ? `Reply edited:\n---\n${item.reply_draft}\n---\n${editedReply}`
      : "";
    try {
      const res = await fetch(`/api/approval-inbox/${item.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edited_reply: editedReply, diff }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setEditOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save edit");
    } finally {
      setLoading(null);
    }
  }

  async function handleReject() {
    setLoading("reject");
    setError(null);
    try {
      const res = await fetch(`/api/approval-inbox/${item.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setRejectOpen(false);
      router.push("/approval-inbox");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setLoading(null);
    }
  }

  if (item.status !== "pending") {
    return (
      <div className="text-sm text-slate-500">
        This item was {item.status} on{" "}
        {item.resolved_at ? new Date(item.resolved_at).toLocaleString("it-IT") : "—"}
      </div>
    );
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <Button onClick={handleApprove} disabled={!!loading}>
          {loading === "approve" ? "Approving..." : "Approve"}
        </Button>
        <Button variant="outline" onClick={() => setEditOpen(true)} disabled={!!loading}>
          Edit
        </Button>
        <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={!!loading}>
          Reject
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit reply draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reply draft</Label>
            <Textarea
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={loading === "edit"}>
              {loading === "edit" ? "Saving..." : "Save & mark edited"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject item</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this being rejected?"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading === "reject"}>
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
