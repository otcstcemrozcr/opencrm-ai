"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type FilterDef = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

type Props = {
  searchPlaceholder?: string;
  filters?: FilterDef[];
  sorts?: { value: string; label: string }[];
  /** Extra params to preserve when navigating (e.g. view). */
  preserve?: string[];
};

export function FilterBar({ searchPlaceholder = "Search…", filters = [], sorts = [], preserve = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams();
      // keep preserved params
      for (const p of preserve) {
        const v = params.get(p);
        if (v) next.set(p, v);
      }
      // keep existing filter/search/sort params
      const keys = ["q", "sort", ...filters.map((f) => f.name)];
      for (const k of keys) {
        const v = params.get(k);
        if (v) next.set(k, v);
      }
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, params, filters, preserve]
  );

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setParam("q", (fd.get("q") as string)?.trim() ?? "");
  }

  const hasActive =
    Boolean(params.get("q")) ||
    Boolean(params.get("sort")) ||
    filters.some((f) => params.get(f.name));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={onSearch} className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={searchPlaceholder}
          className="w-56 pl-8"
        />
      </form>

      {filters.map((f) => (
        <Select
          key={f.name}
          className="h-10 w-auto"
          value={params.get(f.name) ?? ""}
          onChange={(e) => setParam(f.name, e.target.value)}
        >
          <option value="">{f.label}: All</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      ))}

      {sorts.length > 0 && (
        <Select
          className="h-10 w-auto"
          value={params.get("sort") ?? ""}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="">Sort: Newest</option>
          {sorts.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      )}

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          <X className="h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
