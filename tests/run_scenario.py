"""
End-to-end meeting scenario runner.

Starts a meeting, injects a pre-written transcript scenario, generates
recommendations, and optionally saves the prospect as a CRM client.

Usage:
    # List available scenarios
    python tests/run_scenario.py --list

    # Run a single scenario (just inject + show profile completeness)
    python tests/run_scenario.py sarah_chen

    # Run full pipeline: inject → recommend → finalize → complete → promote
    python tests/run_scenario.py sarah_chen --full

    # Run all scenarios sequentially
    python tests/run_scenario.py --all --full

    # Inject with pacing (realistic delay between lines, ms)
    python tests/run_scenario.py marcus_williams --delay 800

Environment:
    CAPMARKET_BASE_URL  Backend base URL (default: http://localhost:8000)
    CAPMARKET_ADVISOR   Advisor ID (default: advisor1)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time

import httpx
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

BASE_URL  = os.environ.get("CAPMARKET_BASE_URL", "http://localhost:8000")
ADVISOR   = os.environ.get("CAPMARKET_ADVISOR",  "alex_morgan")
API       = f"{BASE_URL}/api"


# ── helpers ────────────────────────────────────────────────────────────────────

def _hdr(title: str) -> None:
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


def _ok(label: str, value: object) -> None:
    print(f"  [OK]  {label}: {value}")


def _err(label: str, value: object) -> None:
    print(f"  [ERR] {label}: {value}", file=sys.stderr)


async def run_scenario(
    scenario_name: str,
    *,
    full_pipeline: bool = False,
    delay_ms: int = 0,
    client: httpx.AsyncClient,
) -> dict:
    from scenarios.profiles import SCENARIOS, SCENARIO_DESCRIPTIONS

    if scenario_name not in SCENARIOS:
        _err("unknown scenario", scenario_name)
        _err("available", list(SCENARIOS.keys()))
        return {}

    segments   = SCENARIOS[scenario_name]
    desc       = SCENARIO_DESCRIPTIONS.get(scenario_name, "")
    _hdr(f"Scenario: {scenario_name}\n  {desc}")

    # ── 1. Start meeting ───────────────────────────────────────────────────────
    t0 = time.perf_counter()
    r = await client.post(f"{API}/meetings/start", json={
        "advisor_id":     ADVISOR,
        "meeting_type":   "prospecting",
        "is_prospective": True,
    })
    r.raise_for_status()
    meeting = r.json()
    session_id = meeting.get("session_id") or meeting.get("id")
    _ok("meeting started", session_id)

    # ── 2. Inject transcript ───────────────────────────────────────────────────
    r = await client.post(
        f"{API}/meetings/{session_id}/inject-transcript",
        json={"segments": segments, "delay_ms": delay_ms},
        timeout=120.0,
    )
    r.raise_for_status()
    inject = r.json()
    completeness = inject.get("profile_completeness", 0)
    _ok("segments injected", inject.get("segments_processed"))
    _ok("profile completeness", f"{completeness * 100:.0f}%")

    if not full_pipeline:
        elapsed = time.perf_counter() - t0
        print(f"\n  Done in {elapsed:.1f}s  (use --full to run the complete pipeline)")
        return {"session_id": session_id, "completeness": completeness}

    # ── 3. Generate recommendations ────────────────────────────────────────────
    r = await client.post(f"{API}/meetings/{session_id}/recommend", timeout=60.0)
    r.raise_for_status()
    recs = r.json().get("recommendations", [])
    _ok("recommendations generated", len(recs))
    for i, rec in enumerate(recs[:3]):
        title = rec.get("title") or rec.get("action") or str(rec)[:80]
        print(f"       {i+1}. {title}")
    if len(recs) > 3:
        print(f"       … and {len(recs) - 3} more")

    # ── 4. Approve all recommendations ────────────────────────────────────────
    rec_indices = list(range(len(recs)))
    r = await client.post(
        f"{API}/meetings/{session_id}/approve-recommendations",
        json={"approved_indices": rec_indices, "approved_by": ADVISOR},
    )
    r.raise_for_status()
    _ok("recommendations approved", r.json().get("approved_count"))

    # ── 5. Finalize (summary) ─────────────────────────────────────────────────
    r = await client.post(f"{API}/meetings/{session_id}/finalize", json={}, timeout=90.0)
    r.raise_for_status()
    _ok("finalize", r.json().get("status"))

    # ── 6. Complete (persist) ─────────────────────────────────────────────────
    # Poll up to 30s for finalize background task
    for _ in range(30):
        await asyncio.sleep(1)
        status_r = await client.get(f"{API}/meetings/{session_id}/status")
        if status_r.status_code == 200:
            gate = status_r.json().get("gate")
            if gate == "summary_review" or gate is None:
                break
    r = await client.post(
        f"{API}/meetings/{session_id}/complete",
        json={"approved_by": ADVISOR},
        timeout=30.0,
    )
    r.raise_for_status()
    _ok("meeting completed", r.json().get("status"))

    # ── 7. Promote to CRM client ──────────────────────────────────────────────
    r = await client.post(
        f"{API}/meetings/{session_id}/promote-to-client",
        json={"advisor_id": ADVISOR},
        timeout=30.0,
    )
    r.raise_for_status()
    result = r.json()
    _ok("client created", result.get("client_id"))
    _ok("client name",    result.get("name"))
    _ok("missing fields", result.get("missing_fields", []))

    elapsed = time.perf_counter() - t0
    print(f"\n  Pipeline complete in {elapsed:.1f}s")
    return result


# ── CLI entry-point ────────────────────────────────────────────────────────────

async def main(argv: list[str] | None = None) -> None:
    from scenarios.profiles import SCENARIOS, SCENARIO_DESCRIPTIONS

    parser = argparse.ArgumentParser(
        description="Run a capmarket meeting scenario end-to-end",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("scenario", nargs="?", help="Scenario name (omit when using --list / --all)")
    parser.add_argument("--full",  action="store_true", help="Run the full pipeline (recommend → finalize → promote)")
    parser.add_argument("--all",   action="store_true", help="Run all scenarios")
    parser.add_argument("--list",  action="store_true", help="List available scenarios")
    parser.add_argument("--delay", type=int, default=0, metavar="MS",
                        help="Delay in ms between injected segments (default: 0 = max speed)")
    args = parser.parse_args(argv)

    if args.list:
        print("\nAvailable scenarios:\n")
        for name, desc in SCENARIO_DESCRIPTIONS.items():
            print(f"  {name:<32}  {desc}")
        print()
        return

    async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
        if args.all:
            for name in SCENARIOS:
                await run_scenario(name, full_pipeline=args.full, delay_ms=args.delay, client=client)
        elif args.scenario:
            await run_scenario(args.scenario, full_pipeline=args.full, delay_ms=args.delay, client=client)
        else:
            parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
