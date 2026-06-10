#!/usr/bin/env python3
"""Cyclops OS — Memory Vault CLI.

Dependency-free (stdlib only). Makes the founder memory actually usable:

    python tools/cyclops.py capture --type idea --title "Use OpenOps for SAP audits"
    python tools/cyclops.py validate
    python tools/cyclops.py index

Principle: capture first, never lose an idea. Deterministic, git-friendly Markdown.
"""
from __future__ import annotations

import argparse
import base64
import datetime as _dt
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MEMORY = ROOT / "memory"

# type -> folder
TYPE_DIR = {
    "project": "projects",
    "product": "products",
    "customer": "customers",
    "revenue": "revenue",
    "idea": "ideas",
    "meeting": "meetings",
    "roadmap": "roadmap",
    "decision": "decisions",
    "academy": "academy",
    "finance": "finance",
    "ai-news": "ai-news",
}
REQUIRED = ("id", "type", "title", "status", "created", "updated")
SKIP_NAMES = {"README.md", "INDEX.md"}

TODAY = _dt.date.today().isoformat()
TODAY_D = _dt.date.today()


def _date(s: str) -> _dt.date:
    try:
        return _dt.date.fromisoformat(s[:10])
    except (ValueError, TypeError):
        return _dt.date(1970, 1, 1)


# --------------------------------------------------------------------------- #
# Minimal frontmatter parsing (handles the simple subset Cyclops uses)
# --------------------------------------------------------------------------- #
def parse_frontmatter(text: str) -> dict | None:
    """Return frontmatter dict, or None if no frontmatter block."""
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    block = text[3:end].strip("\n")
    data: dict = {}
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key = key.strip()
        val = val.strip()
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            data[key] = [v.strip().strip('"').strip("'") for v in inner.split(",") if v.strip()]
        else:
            data[key] = val.strip('"').strip("'")
    return data


def iter_entries():
    """Yield (path, frontmatter) for every real memory entry."""
    for path in sorted(MEMORY.rglob("*.md")):
        if path.name in SKIP_NAMES or path.name.startswith("_schema"):
            continue
        fm = parse_frontmatter(path.read_text(encoding="utf-8"))
        if fm is not None:
            yield path, fm


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:60] or "untitled"


# --------------------------------------------------------------------------- #
# Commands
# --------------------------------------------------------------------------- #
def cmd_validate(_args) -> int:
    problems: list[str] = []
    ids: dict[str, Path] = {}
    all_ids: set[str] = set()
    link_refs: list[tuple[Path, str]] = []

    for path, fm in iter_entries():
        rel = path.relative_to(ROOT)
        for field in REQUIRED:
            if not fm.get(field):
                problems.append(f"{rel}: missing required field '{field}'")
        eid = fm.get("id", "")
        if eid:
            if eid in ids:
                problems.append(f"{rel}: duplicate id '{eid}' (also {ids[eid].relative_to(ROOT)})")
            ids[eid] = path
            all_ids.add(eid)
        for d in ("created", "updated"):
            v = fm.get(d, "")
            if v and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
                problems.append(f"{rel}: '{d}' must be YYYY-MM-DD, got '{v}'")
        # Auto-synced snapshots embed external content verbatim; don't link-check them.
        if not fm.get("source_repo"):
            for ref in re.findall(r"\[\[([a-z0-9\-]+)\]\]", path.read_text(encoding="utf-8")):
                link_refs.append((path, ref))

    for path, ref in link_refs:
        if ref not in all_ids:
            problems.append(f"{path.relative_to(ROOT)}: broken link [[{ref}]] (no such id)")

    count = len(ids)
    if problems:
        print(f"VALIDATION FAILED — {len(problems)} problem(s) across {count} entries:\n")
        for p in problems:
            print("  ✗ " + p)
        return 1
    print(f"OK — {count} entries valid, all links resolve.")
    return 0


def cmd_index(_args) -> int:
    groups: dict[str, list[tuple[str, str, str]]] = {}
    for path, fm in iter_entries():
        t = fm.get("type", "unknown")
        rel = path.relative_to(MEMORY).as_posix()
        groups.setdefault(t, []).append((fm.get("title", path.stem), rel, fm.get("status", "")))

    order = ["project", "product", "customer", "revenue", "idea",
             "decision", "meeting", "roadmap", "academy", "finance", "ai-news"]
    heading = {
        "project": "Projects", "product": "Products", "customer": "Customers",
        "revenue": "Revenue / Deals", "idea": "Ideas", "decision": "Decisions",
        "meeting": "Meetings", "roadmap": "Roadmap", "academy": "Academy",
        "finance": "Finance", "ai-news": "AI News",
    }
    lines = ["# Memory Index", "",
             "Registry of all memory entries. Auto-generated by `tools/cyclops.py index`.", ""]
    for t in order:
        lines.append(f"## {heading.get(t, t.title())}")
        items = sorted(groups.get(t, []))
        if not items:
            lines.append("_(none yet)_")
        else:
            for title, rel, status in items:
                suffix = f" · {status}" if status else ""
                lines.append(f"- [{title}]({rel}) — {Path(rel).stem}{suffix}")
        lines.append("")

    (MEMORY / "INDEX.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    total = sum(len(v) for v in groups.values())
    print(f"INDEX.md regenerated — {total} entries.")
    return 0


# --------------------------------------------------------------------------- #
# GitHub sync (Watchtower core) — pulls project-follow from each product repo
# --------------------------------------------------------------------------- #
class GhError(RuntimeError):
    pass


def _gh_bin() -> str | None:
    """Locate the gh executable even if it isn't on this shell's PATH yet."""
    found = shutil.which("gh")
    if found:
        return found
    candidates = [
        Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "GitHub CLI" / "gh.exe",
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Links" / "gh.exe",
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return None


def _gh_api(endpoint: str):
    gh = _gh_bin()
    if not gh:
        raise GhError("gh not found")
    res = subprocess.run([gh, "api", endpoint], capture_output=True, text=True,
                         encoding="utf-8", errors="replace")
    if res.returncode != 0:
        raise GhError((res.stderr or res.stdout).strip())
    return json.loads(res.stdout) if res.stdout.strip() else None


def _gh_file(owner_repo: str, path: str) -> str | None:
    """Return decoded file content, or None if it doesn't exist."""
    try:
        data = _gh_api(f"repos/{owner_repo}/contents/{path}")
    except GhError as e:
        if "404" in str(e) or "Not Found" in str(e):
            return None
        raise
    content = data.get("content", "") if isinstance(data, dict) else ""
    return base64.b64decode(content.replace("\n", "")).decode("utf-8", errors="replace")


def _latest_commit(owner_repo: str, path: str = "") -> tuple[str, str]:
    """Return (short_sha, iso_date) of the latest commit (optionally touching `path`)."""
    q = f"repos/{owner_repo}/commits?per_page=1" + (f"&path={path}" if path else "")
    commits = _gh_api(q)
    if commits:
        c = commits[0]
        return c["sha"][:10], c["commit"]["committer"]["date"][:10]
    return "", ""


def _issue_counts(owner_repo: str) -> tuple:
    """Return (open, closed) issue counts via the search API; (None, None) on failure."""
    def total(state: str):
        try:
            r = _gh_api(f"search/issues?q=repo:{owner_repo}+type:issue+state:{state}&per_page=1")
            return r.get("total_count") if isinstance(r, dict) else None
        except GhError:
            return None
    return total("open"), total("closed")


def _registered_products():
    """Yield (id, frontmatter) for project entries that declare a repo + follow_path."""
    for path, fm in iter_entries():
        if fm.get("type") == "project" and fm.get("repo") and fm.get("follow_path"):
            yield fm["id"], fm


def cmd_sync(args) -> int:
    if not _gh_bin():
        print("gh (GitHub CLI) is not installed or not on PATH.", file=sys.stderr)
        print("  Install:  winget install --id GitHub.cli", file=sys.stderr)
        print("  Auth:     gh auth login", file=sys.stderr)
        return 3

    products = [(pid, fm) for pid, fm in _registered_products()
                if not args.product or pid == args.product]
    if not products:
        target = f"'{args.product}'" if args.product else "any product"
        print(f"No registered repo found for {target}. "
              f"Add 'repo:' and 'follow_path:' to the project's frontmatter.")
        return 1

    out_dir = MEMORY / "products"
    out_dir.mkdir(parents=True, exist_ok=True)
    changed, unchanged, failed = [], [], []

    for pid, fm in products:
        repo = fm["repo"]
        follow = fm["follow_path"].strip().strip("/")
        if follow in (".", ""):  # repo root
            follow = ""
        title = fm.get("title", pid)
        loc = f"{repo}/{follow}" if follow else repo
        print(f"-> {pid} ({loc}) ...", flush=True)
        try:
            new_sha, commit_date = _latest_commit(repo, follow)
            dest = out_dir / f"{pid}-state.md"
            prior_sha = ""
            if dest.exists():
                prior = parse_frontmatter(dest.read_text(encoding="utf-8")) or {}
                prior_sha = prior.get("source_sha", "")

            base = f"repos/{repo}/contents" + (f"/{follow}" if follow else "")
            listing = _gh_api(base) or []
            names = [f["name"] for f in listing
                     if isinstance(f, dict) and f.get("type") == "file"
                     and f["name"].lower().endswith(".md")]
            lower = {n.lower(): n for n in names}

            # Latest status file = .md whose name carries the most recent YYYY-MM-DD.
            dated = [(m.group(), n) for n in names
                     if (m := re.search(r"\d{4}-\d{2}-\d{2}", n))]
            latest_status = max(dated)[1] if dated else None

            def _pick(cands):
                for c in cands:
                    if c in lower:
                        return lower[c]
                return None

            primary = (_pick(["current-session.md", "project_follow.md",
                              "project-follow.md", "readme.md"])
                       or latest_status or (sorted(names)[0] if names else None))
            backlog_name = _pick(["backlog.md"]) or next(
                (n for n in names if "backlog" in n.lower()), None)

            def _fetch(name):
                if not name:
                    return None
                return _gh_file(repo, f"{follow}/{name}" if follow else name)

            compass = _fetch(primary)
            backlog = _fetch(backlog_name)
            open_i, closed_i = _issue_counts(repo)

            body = [
                "---",
                f"id: {pid}-state",
                "type: product",
                f'title: "{title} — State (synced)"',
                "status: synced",
                f"created: {TODAY}",
                f"updated: {TODAY}",
                "tags: [synced, watchtower]",
                f"links: [{pid}]",
                f"source_repo: {repo}",
                f"source_path: {follow or '(root)'}",
                f"source_sha: {new_sha}",
                f"last_commit: {commit_date}",
                f"open_issues: {open_i if open_i is not None else ''}",
                f"closed_issues: {closed_i if closed_i is not None else ''}",
                "---",
                "",
                f"# {title} — State Snapshot",
                "",
                f"> Auto-synced from `{loc}` on {TODAY}. Do not hand-edit — rerun "
                f"`python tools/cyclops.py sync`. Curated entry: [[{pid}]].",
                "",
                f"- **Last commit:** `{new_sha}` ({commit_date or '?'})",
                f"- **Open issues:** {open_i if open_i is not None else '?'}  ·  "
                f"**Closed issues:** {closed_i if closed_i is not None else '?'}",
                f"- **Primary follow file:** {primary or '(none found)'}",
                f"- **Latest status file:** {latest_status or '(none)'}",
                f"- **Tracking .md files:** {len(names)}",
                "",
                f"## {primary or 'Compass'}",
                "",
                (compass.strip() if compass else "_(no primary follow file found)_"),
                "",
                "## Backlog",
                "",
                (backlog.strip() if backlog else "_(no backlog file found)_"),
                "",
            ]
            dest.write_text("\n".join(body).rstrip() + "\n", encoding="utf-8")

            tail = f"({latest_status or primary or 'no tracking file'})"
            if new_sha and new_sha == prior_sha:
                unchanged.append(pid)
                print(f"   unchanged (sha {new_sha})  issues:{open_i}/{closed_i}")
            else:
                changed.append((pid, prior_sha, new_sha))
                print(f"   updated  {prior_sha or 'none'} -> {new_sha}  {tail}  issues:{open_i}/{closed_i}")
        except GhError as e:
            failed.append((pid, str(e)))
            print(f"   FAILED: {e}", file=sys.stderr)

    print("\n=== Sync summary ===")
    print(f"  changed:   {len(changed)}  {[c[0] for c in changed]}")
    print(f"  unchanged: {len(unchanged)} {unchanged}")
    if failed:
        print(f"  failed:    {len(failed)} {[f[0] for f in failed]}")
    if changed:
        print("\nRun `python tools/cyclops.py index` to refresh INDEX.md.")
    return 0 if not failed else 1


# --------------------------------------------------------------------------- #
# Daily briefing (Executive Briefing Engine, minimal) — for the human founder
# --------------------------------------------------------------------------- #
def _load_dotenv():
    """Load KEY=VALUE pairs from repo .env into os.environ (no dependency)."""
    f = ROOT / ".env"
    if not f.exists():
        return
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def _focus() -> str | None:
    f = ROOT / "current-focus.md"
    if not f.exists():
        return None
    for line in f.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s and not s.startswith("#") and not s.startswith(">") and not s.startswith("---"):
            return s
    return None


def _system_status() -> list[str]:
    """Live snapshot of the Cyclops OS itself, counted from real files."""
    entries = list(iter_entries())
    n = len(entries)
    products = sum(1 for _p, fm in entries if fm.get("type") == "project" and fm.get("repo"))
    schemas = len(list(MEMORY.rglob("_schema.md")))
    libdir = ROOT / "docs" / "library"
    libdocs = sum(1 for p in libdir.rglob("*.md") if p.name.lower() != "readme.md") \
        if libdir.exists() else 0
    return [
        "## Cyclops at a glance",
        "",
        f"- 🧠 **Memory Vault** — {n} entries · {schemas} schemas · CLI (capture/validate/index/sync/brief)",
        f"- 🛰️ **Watchtower** — {products} products live-synced from GitHub · daily 08:00",
        f"- 📚 **Library** — {libdocs} rescued docs (master-prompts + strategy)",
        "- 🏛️ **Constitution** — full + distilled (CLAUDE.md)",
        "- 📋 **GitHub** — private repo · Epics → issues + milestones",
        "- 💡 **Strategy** — OneOpenERP umbrella (oneopenerp.com)",
    ]


# Heuristic: how long a product may sit in a stage before it's a bottleneck (days).
STAGE_MAX_DAYS = {
    "idea": 30,
    "prototype": 75,
    "mvp": 120,
    "demo ready": 60,
    "customer ready": 90,
    "revenue ready": 0,   # 0 = never flag (success state)
}


def _stage_stuck(fm: dict):
    """Return (stage, days, threshold) if stuck in a stage too long, else None.
    Uses 'stage_since' if present, else 'created'. Skips intentionally parked products."""
    status = (fm.get("status") or "").lower()
    stage = (fm.get("stage") or "").lower()
    if "await" in status or "park" in status or "paused" in stage:
        return None
    thr = STAGE_MAX_DAYS.get(stage)
    if not thr:  # unknown stage or success state
        return None
    since = fm.get("stage_since") or fm.get("created")
    if not since:
        return None
    days = (TODAY_D - _date(since)).days
    return (stage, days, thr) if days > thr else None


def _health(fm: dict, state: dict) -> tuple[str, str]:
    """Traffic-light health from commit recency, respecting intentional parking."""
    status = (fm.get("status") or "").lower()
    stage = (fm.get("stage") or "").lower()
    if "await" in status or "park" in status or "paused" in stage:
        return "⏸️", "parked (intentional)"
    last = state.get("last_commit", "")
    if not last or last == "?":
        return "⬜", "no data"
    days = (TODAY_D - _date(last)).days
    if days <= 7:
        return "🟢", f"active ({days}d)"
    if days <= 21:
        return "🟡", f"slowing ({days}d)"
    return "🔴", f"stale ({days}d)"


def _build_briefing() -> str:
    L = [f"# Cyclops Daily Briefing — {TODAY}", ""]
    focus = _focus()
    L.append(f"**This week's focus:** {focus}" if focus else
             "_No current focus set (edit `current-focus.md`)._")
    L += ["", "## Products", "", "| Product | Health | Stage | Last commit | Open | Closed |",
          "|---------|--------|-------|-------------|------|--------|"]
    revenue_nearest, attention, stuck = [], [], []
    for _path, fm in iter_entries():
        if fm.get("type") != "project" or not fm.get("repo"):
            continue
        pid = fm.get("id", "")
        sf = MEMORY / "products" / f"{pid}-state.md"
        state = parse_frontmatter(sf.read_text(encoding="utf-8")) if sf.exists() else {}
        title = fm.get("title", pid)
        emoji, label = _health(fm, state)
        oi = state.get("open_issues", "") or "0"
        ci = state.get("closed_issues", "") or "0"
        L.append(f"| {title} | {emoji} | {fm.get('stage', '?')} | "
                 f"{state.get('last_commit', '?')} | {oi} | {ci} |")
        if emoji in ("🟡", "🔴"):
            attention.append((emoji, title, label))
        s = _stage_stuck(fm)
        if s:
            stuck.append((title, s[0], s[1], s[2]))
        if "revenue-nearest" in (fm.get("tags") or []):
            revenue_nearest.append(title)

    L += ["", "## Look at today", ""]
    looks = []
    if focus:
        looks.append(f"Stay on focus: **{focus}**")
    for emoji, title, label in sorted(attention, key=lambda x: 0 if x[0] == "🔴" else 1):
        looks.append(f"{emoji} **{title}** — {label}, no recent movement.")
    for title, stage, days, thr in stuck:
        looks.append(f"⏳ **{title}** stuck in {stage} {days}d (expected <{thr}d) — unblock or re-scope.")
    if revenue_nearest:
        looks.append(f"💰 Revenue-nearest: **{', '.join(revenue_nearest)}** — push toward a paying customer.")
    if not looks:
        looks.append("All products active or intentionally parked. Pick a focus item and move it forward.")
    L += [f"- {x}" for x in looks]
    L += [""] + _system_status()
    L += ["", "_Generated by `cyclops brief`. Reply to nothing — this is your glance, not a task._"]
    return "\n".join(L) + "\n"


def _send_email(subject: str, body_md: str) -> str:
    _load_dotenv()
    host = os.environ.get("CYCLOPS_SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("CYCLOPS_SMTP_PORT", "587"))
    user = os.environ.get("CYCLOPS_SMTP_USER")
    pw = (os.environ.get("CYCLOPS_SMTP_PASS") or "").replace(" ", "")  # Gmail shows it spaced
    to = os.environ.get("CYCLOPS_BRIEF_TO", user)
    if not (user and pw and to):
        return "email skipped (set CYCLOPS_SMTP_USER/PASS/BRIEF_TO in .env)"
    import smtplib
    from email.message import EmailMessage
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, user, to
    msg.set_content(body_md)
    try:
        with smtplib.SMTP(host, port, timeout=30) as s:
            s.starttls()
            s.login(user, pw)
            s.send_message(msg)
        return f"emailed to {to}"
    except Exception as e:  # noqa: BLE001
        return f"email FAILED: {e}"


def cmd_brief(args) -> int:
    body = _build_briefing()
    out_dir = ROOT / "briefings"
    out_dir.mkdir(exist_ok=True)
    (out_dir / f"{TODAY}.md").write_text(body, encoding="utf-8")
    print(body)
    print(f"[written: briefings/{TODAY}.md]")
    if args.email:
        print("[" + _send_email(f"Cyclops Briefing — {TODAY}", body) + "]")
    return 0


# --------------------------------------------------------------------------- #
# Weekly review — the Sunday 15-minute glance (wider lens than the daily brief)
# --------------------------------------------------------------------------- #
def _commits_since(repo: str, since: str) -> int:
    try:
        data = _gh_api(f"repos/{repo}/commits?since={since}T00:00:00Z&per_page=100")
        return len(data) if isinstance(data, list) else 0
    except GhError:
        return 0


def _closed_since(repo: str, since: str) -> int:
    try:
        r = _gh_api(f"search/issues?q=repo:{repo}+type:issue+state:closed+closed:>={since}")
        return r.get("total_count", 0) if isinstance(r, dict) else 0
    except GhError:
        return 0


def cmd_weekly(args) -> int:
    if not _gh_bin():
        print("gh (GitHub CLI) is required for the weekly review.", file=sys.stderr)
        return 3
    since = (TODAY_D - _dt.timedelta(days=7)).isoformat()
    L = [f"# Cyclops Weekly Review — week ending {TODAY}", "",
         f"_Activity since {since}._", ""]
    focus = _focus()
    L.append(f"**Focus this week:** {focus}" if focus else "_No focus set (edit current-focus.md)._")
    L += ["", "## Activity", "",
          "| Product | Health | Stage | Commits (7d) | Closed issues (7d) | Last commit |",
          "|---------|--------|-------|--------------|--------------------|-------------|"]
    stale, stuck, busiest, total_commits = [], [], ("", -1), 0
    for _p, fm in iter_entries():
        if fm.get("type") != "project" or not fm.get("repo"):
            continue
        pid, repo, title = fm.get("id", ""), fm["repo"], fm.get("title", fm.get("id", ""))
        sf = MEMORY / "products" / f"{pid}-state.md"
        state = (parse_frontmatter(sf.read_text(encoding="utf-8")) or {}) if sf.exists() else {}
        last = state.get("last_commit", "?")
        emoji, _ = _health(fm, state)
        c = _commits_since(repo, since)
        ci = _closed_since(repo, since)
        total_commits += c
        L.append(f"| {title} | {emoji} | {fm.get('stage', '?')} | {c} | {ci} | {last} |")
        if c > busiest[1]:
            busiest = (title, c)
        if emoji == "🔴":
            stale.append(title)
        s = _stage_stuck(fm)
        if s:
            stuck.append((title, s[0], s[1], s[2]))

    L += ["", "## Signals", ""]
    L.append(f"- Total commits across products this week: **{total_commits}**")
    if busiest[0] and busiest[1] > 0:
        L.append(f"- 🔥 Most active: **{busiest[0]}** ({busiest[1]} commits)")
    if stale:
        L.append(f"- 🔴 Stale (no recent commits): {', '.join(stale)}")
    for title, stage, days, thr in stuck:
        L.append(f"- ⏳ {title} stuck in {stage} {days}d (expected <{thr}d) — bottleneck")
    if not total_commits:
        L.append("- 😴 Quiet week — no commits anywhere. Is that intentional, or is something stuck?")
    L.append("- 🎯 Set next week's single priority in `current-focus.md`.")
    L += ["", *_system_status(),
          "", "_Weekly review by `cyclops weekly`. Your 15-minute Sunday glance._"]
    body = "\n".join(L) + "\n"

    out = ROOT / "briefings"
    out.mkdir(exist_ok=True)
    (out / f"weekly-{TODAY}.md").write_text(body, encoding="utf-8")
    print(body)
    print(f"[written: briefings/weekly-{TODAY}.md]")
    if args.email:
        print("[" + _send_email(f"Cyclops Weekly Review — {TODAY}", body) + "]")
    return 0


# --------------------------------------------------------------------------- #
# Revenue readiness rollup — prioritize by business impact (the mission)
# --------------------------------------------------------------------------- #
def _readiness_rows() -> list[dict]:
    """Scored products, ranked by revenue readiness (then customer, then demo)."""
    def _i(fm, k):
        try:
            return int(fm.get(k) or 0)
        except (TypeError, ValueError):
            return 0
    rows = []
    for _p, fm in iter_entries():
        if fm.get("type") != "project" or fm.get("revenue_readiness") in (None, ""):
            continue
        rows.append({
            "title": fm.get("title", fm.get("id", "")),
            "stage": fm.get("stage", "?"),
            "revenue": _i(fm, "revenue_readiness"),
            "customer": _i(fm, "customer_readiness"),
            "demo": _i(fm, "demo_readiness"),
        })
    rows.sort(key=lambda r: (r["revenue"], r["customer"], r["demo"]), reverse=True)
    return rows


def cmd_revenue(args) -> int:
    rows = _readiness_rows()
    L = [f"# Path to Revenue — {TODAY}", "",
         "Products ranked by revenue readiness (closest to a paying customer first).", "",
         "| # | Product | Stage | Revenue | Customer | Demo |",
         "|---|---------|-------|---------|----------|------|"]
    for i, r in enumerate(rows, 1):
        L.append(f"| {i} | {r['title']} | {r['stage']} | "
                 f"{r['revenue']} | {r['customer']} | {r['demo']} |")
    if rows:
        top = rows[0]
        gap = "customer" if top["customer"] < top["demo"] else "revenue conversion"
        L += ["", f"**Nearest to revenue: {top['title']}** ({top['revenue']}/100). "
                  f"Biggest gap: {gap}. Concentrate revenue effort here."]
    else:
        L += ["", "_No products have `revenue_readiness` set yet._"]
    print("\n".join(L) + "\n")
    return 0


def cmd_capture(args) -> int:
    t = args.type
    if t not in TYPE_DIR:
        print(f"Unknown type '{t}'. Valid: {', '.join(TYPE_DIR)}", file=sys.stderr)
        return 2
    eid = args.id or slugify(args.title)
    folder = MEMORY / TYPE_DIR[t]
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / f"{eid}.md"
    if dest.exists():
        print(f"Refusing to overwrite existing entry: {dest.relative_to(ROOT)}", file=sys.stderr)
        return 1

    status = args.status or {"idea": "captured", "revenue": "Lead"}.get(t, "active")
    tags = "[" + ", ".join(args.tag) + "]" if args.tag else "[]"
    fm = (
        "---\n"
        f"id: {eid}\n"
        f"type: {t}\n"
        f'title: "{args.title}"\n'
        f"status: {status}\n"
        f"created: {TODAY}\n"
        f"updated: {TODAY}\n"
        f"tags: {tags}\n"
        "links: []\n"
        "---\n\n"
        f"# {args.title}\n\n"
        f"{args.note or '> Captured. Fill in details. See _schema.md in this folder.'}\n"
    )
    dest.write_text(fm, encoding="utf-8")
    print(f"Captured: {dest.relative_to(ROOT)}")
    print("Tip: run `python tools/cyclops.py index` to refresh INDEX.md")
    return 0


def main() -> int:
    # Windows consoles default to cp1252 and choke on non-Latin glyphs; force UTF-8.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass

    p = argparse.ArgumentParser(prog="cyclops", description="Cyclops OS Memory Vault CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("validate", help="Check frontmatter + link integrity")
    sub.add_parser("index", help="Regenerate memory/INDEX.md")

    s = sub.add_parser("sync", help="Pull product project-follow from GitHub (needs gh)")
    s.add_argument("--product", help="sync only this product id (default: all registered)")

    b = sub.add_parser("brief", help="Generate the daily founder briefing")
    b.add_argument("--email", action="store_true", help="also email it (needs SMTP env in .env)")

    w = sub.add_parser("weekly", help="Generate the weekly review (needs gh)")
    w.add_argument("--email", action="store_true", help="also email it (needs SMTP env in .env)")

    sub.add_parser("revenue", help="Rank products by revenue readiness (path to revenue)")

    c = sub.add_parser("capture", help="Create a new memory entry")
    c.add_argument("--type", required=True, help="idea, customer, revenue, decision, ...")
    c.add_argument("--title", required=True)
    c.add_argument("--id", help="override the auto-generated id/slug")
    c.add_argument("--status")
    c.add_argument("--note", help="initial body text")
    c.add_argument("--tag", action="append", default=[], help="repeatable")

    args = p.parse_args()
    return {"validate": cmd_validate, "index": cmd_index, "capture": cmd_capture,
            "sync": cmd_sync, "brief": cmd_brief, "weekly": cmd_weekly,
            "revenue": cmd_revenue}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
