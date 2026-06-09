import Link from "next/link";
import { Plus, LayoutGrid, List, Check, RotateCcw, Trash2 } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listAllActivities } from "@/server/services/activities";
import { completeActivityAction, deleteActivityAction } from "@/server/actions/activities";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Activity = Awaited<ReturnType<typeof listAllActivities>>[number];

function relatedHref(a: Activity) {
  return `/${a.relatedType}s/${a.relatedId}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: { view?: string; month?: string };
}) {
  const user = await requireUser();
  const rows = await listAllActivities(user.orgId);
  const writable = canWrite(user.role);
  const view = searchParams.view === "calendar" ? "calendar" : "agenda";

  const header = (
    <PageHeader
      title="Activities"
      description="Calls, meetings, demos and follow-ups."
      action={
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border bg-card p-0.5">
            <Link href="/activities?view=agenda" className={cn("flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm", view === "agenda" ? "bg-muted font-medium" : "text-muted-foreground")}>
              <List className="h-4 w-4" /> Agenda
            </Link>
            <Link href="/activities?view=calendar" className={cn("flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm", view === "calendar" ? "bg-muted font-medium" : "text-muted-foreground")}>
              <LayoutGrid className="h-4 w-4" /> Calendar
            </Link>
          </div>
          {writable && (
            <Link href="/activities/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New activity
            </Link>
          )}
        </div>
      }
    />
  );

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          title="No activities yet"
          description="Log your first call, meeting or follow-up."
          action={writable ? <Link href="/activities/new" className={buttonVariants()}><Plus className="h-4 w-4" /> New activity</Link> : null}
        />
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div className="space-y-6">
        {header}
        <CalendarView rows={rows} monthParam={searchParams.month} />
      </div>
    );
  }

  // Agenda grouping
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 86400000);
  const open = rows.filter((r) => !r.completedAt);
  const completed = rows.filter((r) => r.completedAt);

  const overdue = open.filter((r) => r.dueAt && r.dueAt < today);
  const dueToday = open.filter((r) => r.dueAt && r.dueAt >= today && r.dueAt < tomorrow);
  const upcoming = open.filter((r) => r.dueAt && r.dueAt >= tomorrow);
  const noDate = open.filter((r) => !r.dueAt);

  return (
    <div className="space-y-6">
      {header}
      <Group title="Overdue" tone="destructive" items={overdue} writable={writable} />
      <Group title="Today" tone="accent" items={dueToday} writable={writable} />
      <Group title="Upcoming" items={upcoming} writable={writable} />
      <Group title="No due date" items={noDate} writable={writable} />
      <Group title="Completed" items={completed} writable={writable} completed />
    </div>
  );
}

function Group({
  title,
  items,
  writable,
  tone,
  completed,
}: {
  title: string;
  items: Activity[];
  writable: boolean;
  tone?: "destructive" | "accent";
  completed?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={tone === "destructive" ? "text-destructive" : tone === "accent" ? "text-accent" : ""}>{title}</span>
          <Badge variant="default">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <div className={cn("truncate text-sm font-medium", completed && "text-muted-foreground line-through")}>
                {a.subject}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="capitalize">{a.type.replace("_", " ")}</span>
                {a.relatedLabel && (
                  <>
                    <span>·</span>
                    <Link href={relatedHref(a)} className="hover:underline">{a.relatedLabel}</Link>
                  </>
                )}
                {a.dueAt && (
                  <>
                    <span>·</span>
                    <span>{a.dueAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                  </>
                )}
              </div>
            </div>
            {writable && (
              <div className="flex shrink-0 items-center gap-1">
                <form action={completeActivityAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="path" value="/activities" />
                  <input type="hidden" name="done" value={completed ? "1" : "0"} />
                  <Button variant="ghost" size="icon" type="submit" aria-label={completed ? "Reopen" : "Complete"}>
                    {completed ? <RotateCcw className="h-4 w-4" /> : <Check className="h-4 w-4 text-success" />}
                  </Button>
                </form>
                <form action={deleteActivityAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="path" value="/activities" />
                  <Button variant="ghost" size="icon" type="submit" aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CalendarView({ rows, monthParam }: { rows: Activity[]; monthParam?: string }) {
  const base = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? new Date(`${monthParam}-01T00:00:00`)
    : new Date();
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);
  const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const byDay = new Map<number, Activity[]>();
  for (const a of rows) {
    if (!a.dueAt) continue;
    if (a.dueAt.getFullYear() === year && a.dueAt.getMonth() === month) {
      const d = a.dueAt.getDate();
      const arr = byDay.get(d) ?? [];
      arr.push(a);
      byDay.set(d, arr);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = first.toLocaleString("en-US", { month: "long", year: "numeric" });
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{monthName}</CardTitle>
        <div className="flex gap-2">
          <Link href={`/activities?view=calendar&month=${fmtMonth(prev)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Prev</Link>
          <Link href={`/activities?view=calendar&month=${fmtMonth(next)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Next</Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px border-l border-t bg-border text-sm">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-muted/50 px-2 py-1 text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {cells.map((d, i) => (
            <div key={i} className="min-h-[90px] bg-card p-1 align-top">
              {d && (
                <>
                  <div className={cn("mb-1 text-xs", isToday(d) ? "font-semibold text-accent" : "text-muted-foreground")}>{d}</div>
                  <div className="space-y-1">
                    {(byDay.get(d) ?? []).slice(0, 3).map((a) => (
                      <Link
                        key={a.id}
                        href={relatedHref(a)}
                        className={cn(
                          "block truncate rounded px-1 py-0.5 text-xs",
                          a.completedAt ? "bg-muted text-muted-foreground line-through" : "bg-accent/10 text-accent"
                        )}
                        title={a.subject}
                      >
                        {a.subject}
                      </Link>
                    ))}
                    {(byDay.get(d)?.length ?? 0) > 3 && (
                      <div className="px-1 text-xs text-muted-foreground">+{(byDay.get(d)!.length - 3)} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
