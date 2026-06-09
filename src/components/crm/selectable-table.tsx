"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { bulkDelete, bulkAssignOwner, type BulkEntity } from "@/server/actions/bulk";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Row = { id: string; cells: React.ReactNode[] };

type Props = {
  entity: BulkEntity;
  headers: string[];
  rows: Row[];
  ownerOptions: { id: string; name: string }[];
  canWrite: boolean;
};

export function SelectableTable({ entity, headers, rows, ownerOptions, canWrite }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [owner, setOwner] = useState("");
  const [pending, startTransition] = useTransition();

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const ids = [...selected];

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <Card>
      {canWrite && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="h-9 w-44">
              <option value="">Assign owner…</option>
              <option value="__none__">— Unassign —</option>
              {ownerOptions.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="outline"
              disabled={pending || !owner}
              onClick={() => run(() => bulkAssignOwner(entity, ids, owner === "__none__" ? "" : owner))}
            >
              Apply
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => bulkDelete(entity, ids))}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {canWrite && (
              <TableHead className="w-8">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
              </TableHead>
            )}
            {headers.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
              {canWrite && (
                <TableCell className="w-8">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label="Select row"
                  />
                </TableCell>
              )}
              {r.cells.map((c, i) => (
                <TableCell key={i}>{c}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
