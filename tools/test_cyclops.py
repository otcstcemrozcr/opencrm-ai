#!/usr/bin/env python3
"""Tests for the pure logic in cyclops.py (stdlib unittest, no dependencies).

Run:  python tools/test_cyclops.py        (or: python -m unittest -v from tools/)
Covers the bits that run every morning unattended: frontmatter parsing, slugs,
date parsing, and the traffic-light health logic (incl. intentional parking).
"""
from __future__ import annotations

import datetime as dt
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import cyclops as c  # noqa: E402


class TestFrontmatter(unittest.TestCase):
    def test_basic_fields(self):
        fm = c.parse_frontmatter("---\nid: x\ntype: project\nstatus: active\n---\nbody")
        self.assertEqual(fm["id"], "x")
        self.assertEqual(fm["type"], "project")

    def test_list_parsing(self):
        fm = c.parse_frontmatter("---\ntags: [a, b, c]\nlinks: []\n---\n")
        self.assertEqual(fm["tags"], ["a", "b", "c"])
        self.assertEqual(fm["links"], [])

    def test_quoted_value_with_emdash(self):
        fm = c.parse_frontmatter('---\ntitle: "Hello — World"\n---\n')
        self.assertEqual(fm["title"], "Hello — World")

    def test_no_frontmatter_returns_none(self):
        self.assertIsNone(c.parse_frontmatter("# just a heading\n"))

    def test_unterminated_returns_none(self):
        self.assertIsNone(c.parse_frontmatter("---\nid: x\nno closing fence"))


class TestSlugify(unittest.TestCase):
    def test_spaces_and_punctuation(self):
        self.assertEqual(c.slugify("OpenOps for SAP audits!"), "openops-for-sap-audits")

    def test_collapses_and_trims(self):
        self.assertEqual(c.slugify("  Hello   World  "), "hello-world")

    def test_empty_falls_back(self):
        self.assertEqual(c.slugify("!!!"), "untitled")


class TestDate(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(c._date("2026-06-07"), dt.date(2026, 6, 7))

    def test_iso_prefix(self):
        self.assertEqual(c._date("2026-06-07T12:00:00Z"), dt.date(2026, 6, 7))

    def test_garbage_is_epoch(self):
        self.assertEqual(c._date("not-a-date"), dt.date(1970, 1, 1))


class TestHealth(unittest.TestCase):
    def _ago(self, days: int) -> str:
        return (c.TODAY_D - dt.timedelta(days=days)).isoformat()

    def test_active(self):
        self.assertEqual(c._health({}, {"last_commit": self._ago(2)})[0], "🟢")

    def test_boundary_seven_days_is_active(self):
        self.assertEqual(c._health({}, {"last_commit": self._ago(7)})[0], "🟢")

    def test_slowing(self):
        self.assertEqual(c._health({}, {"last_commit": self._ago(14)})[0], "🟡")

    def test_stale(self):
        self.assertEqual(c._health({}, {"last_commit": self._ago(40)})[0], "🔴")

    def test_parked_status_overrides_staleness(self):
        # openerp-demo case: complete & awaiting a customer is NOT a risk
        e, _ = c._health({"status": "complete-awaiting-customer"}, {"last_commit": self._ago(99)})
        self.assertEqual(e, "⏸️")

    def test_paused_stage_is_parked(self):
        self.assertEqual(c._health({"stage": "Paused"}, {"last_commit": self._ago(99)})[0], "⏸️")

    def test_no_data(self):
        self.assertEqual(c._health({}, {})[0], "⬜")


class TestStageStuck(unittest.TestCase):
    def _ago(self, days: int) -> str:
        return (c.TODAY_D - dt.timedelta(days=days)).isoformat()

    def test_stuck_in_idea(self):
        r = c._stage_stuck({"stage": "Idea", "created": self._ago(40)})
        self.assertIsNotNone(r)
        self.assertEqual(r[0], "idea")

    def test_fresh_mvp_not_stuck(self):
        self.assertIsNone(c._stage_stuck({"stage": "MVP", "created": self._ago(10)}))

    def test_parked_never_stuck(self):
        self.assertIsNone(c._stage_stuck(
            {"stage": "MVP", "status": "complete-awaiting-customer", "created": self._ago(999)}))

    def test_revenue_ready_never_flagged(self):
        self.assertIsNone(c._stage_stuck({"stage": "Revenue Ready", "created": self._ago(999)}))

    def test_stage_since_overrides_created(self):
        # old entry, but recently moved into MVP -> not stuck
        r = c._stage_stuck({"stage": "MVP", "created": self._ago(999), "stage_since": self._ago(5)})
        self.assertIsNone(r)


if __name__ == "__main__":
    unittest.main(verbosity=2)
