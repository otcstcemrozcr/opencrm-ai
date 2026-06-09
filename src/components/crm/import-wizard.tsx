"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importRecords } from "@/server/actions/import";
import { IMPORT_FIELDS, type ImportEntity } from "@/config/import-fields";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Minimal CSV parser that handles quoted fields and embedded commas/newlines. */
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((x) => x.trim() !== ""));
  const headers = (nonEmpty.shift() ?? []).map((h) => h.trim());
  return { headers, rows: nonEmpty };
}

export function ImportWizard({ entity }: { entity: ImportEntity }) {
  const router = useRouter();
  const fields = IMPORT_FIELDS[entity];
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ imported: number; skipped: number; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setText);
  }

  function doParse() {
    const p = parseCSV(text);
    setParsed(p);
    // auto-map by header name
    const auto: Record<string, number> = {};
    for (const f of fields) {
      const idx = p.headers.findIndex(
        (h) => h.toLowerCase() === f.key.toLowerCase() || h.toLowerCase() === f.label.split(" ")[0].toLowerCase()
      );
      auto[f.key] = idx;
    }
    setMapping(auto);
    setResult(null);
  }

  function doImport() {
    if (!parsed) return;
    const objs = parsed.rows.map((r) => {
      const o: Record<string, string> = {};
      for (const f of fields) {
        const idx = mapping[f.key];
        o[f.key] = idx >= 0 ? (r[idx] ?? "").trim() : "";
      }
      return o;
    });
    startTransition(async () => {
      const res = await importRecords(entity, objs);
      setResult(res);
      if (res.imported > 0) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Paste CSV or upload a file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"name,industry,website\nAcme,Manufacturing,https://acme.com"}
            className="font-mono text-xs"
          />
          <Button onClick={doParse} disabled={!text.trim()}>Parse</Button>
        </CardContent>
      </Card>

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Map columns ({parsed.rows.length} rows)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <Label className="w-56 shrink-0">
                  {f.label}{f.required && <span className="text-destructive"> *</span>}
                </Label>
                <Select
                  value={mapping[f.key] ?? -1}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                  className="h-9"
                >
                  <option value={-1}>— Skip —</option>
                  {parsed.headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </Select>
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={doImport} disabled={pending}>
                {pending ? "Importing…" : `Import ${parsed.rows.length} records`}
              </Button>
              {result && !result.error && (
                <span className="text-sm text-success">
                  Imported {result.imported}{result.skipped ? `, skipped ${result.skipped}` : ""}.
                </span>
              )}
              {result?.error && <span className="text-sm text-destructive">{result.error}</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
