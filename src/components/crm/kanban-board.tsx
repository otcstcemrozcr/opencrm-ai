"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moveOpportunityStage } from "@/server/actions/opportunities";
import type { OpportunityStage } from "@/server/db/schema";
import { cn, formatCurrency } from "@/lib/utils";

export type BoardItem = {
  id: string;
  name: string;
  accountName: string | null;
  value: string;
  probability: number;
  stage: OpportunityStage;
};

const COLUMNS: { stage: OpportunityStage; label: string }[] = [
  { stage: "new", label: "New" },
  { stage: "qualified", label: "Qualified" },
  { stage: "discovery", label: "Discovery" },
  { stage: "meeting", label: "Meeting" },
  { stage: "proposal", label: "Proposal" },
  { stage: "negotiation", label: "Negotiation" },
  { stage: "won", label: "Won" },
  { stage: "lost", label: "Lost" },
];

export function KanbanBoard({
  items: initialItems,
  canWrite,
}: {
  items: BoardItem[];
  canWrite: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<OpportunityStage | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function onDrop(stage: OpportunityStage) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const current = items.find((i) => i.id === id);
    if (!current || current.stage === stage) return;

    const prev = items;
    setItems((list) => list.map((i) => (i.id === id ? { ...i, stage } : i)));

    startTransition(async () => {
      const res = await moveOpportunityStage(id, stage);
      if (!res.ok) {
        setItems(prev); // revert on failure
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.stage === col.stage);
        const total = colItems.reduce((s, i) => s + Number(i.value), 0);
        return (
          <div
            key={col.stage}
            onDragOver={(e) => {
              if (!canWrite) return;
              e.preventDefault();
              setOverStage(col.stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === col.stage ? null : s))}
            onDrop={() => canWrite && onDrop(col.stage)}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40",
              overStage === col.stage && "ring-2 ring-accent"
            )}
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">{col.label}</span>
              <span className="text-xs text-muted-foreground">
                {colItems.length} · {formatCurrency(total)}
              </span>
            </div>
            <div className="flex-1 space-y-2 p-2">
              {colItems.map((i) => (
                <div
                  key={i.id}
                  draggable={canWrite}
                  onDragStart={() => setDragId(i.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    "rounded-md border bg-card p-3 shadow-sm",
                    canWrite && "cursor-grab active:cursor-grabbing",
                    dragId === i.id && "opacity-50"
                  )}
                >
                  <Link
                    href={`/opportunities/${i.id}`}
                    className="text-sm font-medium text-foreground hover:text-accent hover:underline"
                  >
                    {i.name}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {i.accountName ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium tabular-nums">{formatCurrency(Number(i.value))}</span>
                    <span className="text-muted-foreground">{i.probability}%</span>
                  </div>
                </div>
              ))}
              {colItems.length === 0 && (
                <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
