"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, BookmarkPlus, X } from "lucide-react";
import { saveView, removeSavedView } from "@/server/actions/saved-views";
import { Button } from "@/components/ui/button";

type View = { id: string; name: string; query: string };

export function SavedViews({
  entity,
  views,
}: {
  entity: "lead" | "opportunity" | "account" | "contact";
  views: View[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const currentQuery = params.toString();

  function onSave() {
    const name = window.prompt("Name this view:");
    if (!name?.trim()) return;
    const fd = new FormData();
    fd.set("entity", entity);
    fd.set("name", name.trim());
    fd.set("query", currentQuery);
    startTransition(async () => {
      await saveView(fd);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("entity", entity);
    startTransition(async () => {
      await removeSavedView(fd);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.length > 0 && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Bookmark className="h-3.5 w-3.5" /> Views:
        </span>
      )}
      {views.map((v) => (
        <span key={v.id} className="group inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-xs">
          <Link href={`/${entity}s${v.query ? `?${v.query}` : ""}`} className="hover:text-accent">
            {v.name}
          </Link>
          <button onClick={() => onDelete(v.id)} disabled={pending} aria-label="Delete view" className="text-muted-foreground hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="sm" onClick={onSave} disabled={pending || !currentQuery}>
        <BookmarkPlus className="h-4 w-4" /> Save view
      </Button>
    </div>
  );
}
