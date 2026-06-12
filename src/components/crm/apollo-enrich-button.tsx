"use client";

import { useState, useTransition } from "react";
import { Wand2 } from "lucide-react";
import { enrichRecordAction, type EnrichState } from "@/server/actions/apollo";
import { Button } from "@/components/ui/button";

export function ApolloEnrichButton({ entity, id }: { entity: "lead" | "contact"; id: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<EnrichState | null>(null);

  function enrich() {
    const fd = new FormData();
    fd.set("entity", entity);
    fd.set("id", id);
    start(async () => {
      setState(await enrichRecordAction(fd));
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={enrich} disabled={pending}>
        <Wand2 className="h-3.5 w-3.5" /> {pending ? "Enriching…" : "Enrich with Apollo"}
      </Button>
      {state?.message && <span className="text-xs text-success">{state.message}</span>}
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </div>
  );
}
