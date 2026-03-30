"""
Azure Cosmos DB persistence layer for the Capmarket Wealth Advisor Platform.

All collections are partitioned for optimal query performance.
Uses key-based auth (no RBAC requirement on dev) with async client
for FastAPI compatibility.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from enum import Enum
from types import MappingProxyType
from typing import Any, Optional

from azure.cosmos import PartitionKey
from azure.cosmos.aio import CosmosClient
from azure.identity import ClientSecretCredential

from backend.config import get_settings

logger = logging.getLogger(__name__)

# ── Collection definitions (name → partition_key_path) ────────────────────────
COLLECTIONS: dict[str, str] = {
    "sessions":           "/client_id",    # Meeting sessions
    "clients":            "/advisor_id",   # Client profiles
    "portfolios":         "/client_id",    # Portfolio proposals
    "backtests":          "/client_id",    # Backtest results
    "rebalance_reports":  "/client_id",    # Rebalance reports
    "audit_log":          "/client_id",    # Audit entries
    "agent_audits":       "/run_id",       # Agent-level execution records
    "checkpoints":        "/workflow_id",  # Human-in-the-loop checkpoints
    "advisory_sessions":  "/advisor_id",   # Advisory intelligence queries
    "client_conversations": "/client_id",  # 24/7 client assistant history
}

# ── Singleton ─────────────────────────────────────────────────────────────────
_store: Optional["CosmosStore"] = None


def get_cosmos_store() -> "CosmosStore":
    global _store
    if _store is None:
        _store = CosmosStore()
    return _store


class CosmosStore:
    """
    Async Cosmos DB store for all capmarket collections.
    Thread-safe singleton — call get_cosmos_store() to obtain the instance.
    """

    def __init__(self) -> None:
        s = get_settings()
        self._endpoint = s.cosmosdb_endpoint
        self._database_name = s.cosmos_db_database
        # Use key auth when available, fall back to credential
        self._key: str | None = getattr(s, "cosmos_db_key", None) or None
        self._credential = ClientSecretCredential(
            tenant_id=s.azure_tenant_id,
            client_id=s.azure_client_id,
            client_secret=s.azure_client_secret,
        )

    def _get_client(self) -> CosmosClient:
        if self._key:
            return CosmosClient(self._endpoint, credential=self._key)
        return CosmosClient(self._endpoint, credential=self._credential)

    async def ensure_containers(self) -> None:
        """
        Best-effort: create database and containers if the service principal
        has management-plane RBAC.  Silently skips any individual step that
        returns Forbidden / 403 (typical when using Entra ID data-plane
        credentials that lack sqlDatabases/write).  Containers that already
        exist are never re-created.
        """
        from azure.core.exceptions import HttpResponseError

        ok = 0
        skipped = 0
        async with self._get_client() as client:
            try:
                db = await client.create_database_if_not_exists(id=self._database_name)
            except HttpResponseError as exc:
                if exc.status_code in (403, 401):
                    logger.warning(
                        "cosmos_db_create_skipped reason='SP lacks management-plane RBAC; using existing DB' db=%s",
                        self._database_name,
                    )
                    db = client.get_database_client(self._database_name)
                    skipped += 1
                else:
                    raise

            for name, pk in COLLECTIONS.items():
                try:
                    await db.create_container_if_not_exists(
                        id=name,
                        partition_key=PartitionKey(path=pk),
                    )
                    ok += 1
                except HttpResponseError as exc:
                    if exc.status_code in (403, 401):
                        skipped += 1
                    else:
                        logger.warning("cosmos_container_skipped", container=name, error=str(exc))
                        skipped += 1

        logger.info("cosmos_containers_ready created=%d skipped=%d", ok, skipped)

    # ── Generic CRUD ─────────────────────────────────────────────────────────

    async def upsert(self, collection: str, item: dict[str, Any]) -> dict[str, Any]:
        """Upsert a document. 'id' field must be present."""
        if "id" not in item:
            raise ValueError("Item must have an 'id' field for Cosmos DB upsert.")
        # Serialize datetime objects to ISO strings for Cosmos
        serialized = _serialize(item)
        async with self._get_client() as client:
            db = client.get_database_client(self._database_name)
            container = db.get_container_client(collection)
            result = await container.upsert_item(body=serialized)
        return result

    async def get(
        self, collection: str, item_id: str, partition_key: str
    ) -> Optional[dict[str, Any]]:
        try:
            async with self._get_client() as client:
                db = client.get_database_client(self._database_name)
                container = db.get_container_client(collection)
                return await container.read_item(item=item_id, partition_key=partition_key)
        except Exception:
            return None

    async def query(
        self,
        collection: str,
        query: str,
        parameters: Optional[list[dict]] = None,
        max_items: int = 100,
    ) -> list[dict[str, Any]]:
        results = []
        async with self._get_client() as client:
            db = client.get_database_client(self._database_name)
            container = db.get_container_client(collection)
            async for item in container.query_items(
                query=query,
                parameters=parameters or [],
                max_item_count=max_items,
            ):
                results.append(item)
        return results

    async def delete(self, collection: str, item_id: str, partition_key: str) -> None:
        async with self._get_client() as client:
            db = client.get_database_client(self._database_name)
            container = db.get_container_client(collection)
            await container.delete_item(item=item_id, partition_key=partition_key)

    # ── Meeting Sessions ──────────────────────────────────────────────────────

    async def save_session(self, session: dict[str, Any]) -> None:
        session["id"] = session.get("session_id", session.get("id"))
        await self.upsert("sessions", session)

    async def get_session(self, session_id: str, client_id: str) -> Optional[dict]:
        return await self.get("sessions", session_id, client_id)

    async def list_sessions_for_client(self, client_id: str) -> list[dict]:
        # Also match sessions where a prospect was promoted to this client_id
        return await self.query(
            "sessions",
            "SELECT * FROM c WHERE c.client_id = @cid OR c.linked_client_id = @cid ORDER BY c.created_at DESC",
            [{"name": "@cid", "value": client_id}],
        )

    # ── Client Profiles ───────────────────────────────────────────────────────

    async def save_client(self, client: dict[str, Any]) -> None:
        client["id"] = client.get("client_id", client.get("id"))
        await self.upsert("clients", client)

    async def get_client(self, client_id: str, advisor_id: str) -> Optional[dict]:
        results = await self.query(
            "clients",
            "SELECT * FROM c WHERE c.client_id = @cid AND c.advisor_id = @aid",
            [{"name": "@cid", "value": client_id}, {"name": "@aid", "value": advisor_id}],
            max_items=1,
        )
        return results[0] if results else None

    async def list_clients_for_advisor(self, advisor_id: str) -> list[dict]:
        return await self.query(
            "clients",
            "SELECT * FROM c WHERE c.advisor_id = @aid ORDER BY c.last_name",
            [{"name": "@aid", "value": advisor_id}],
        )

    # ── Portfolio Proposals ───────────────────────────────────────────────────

    async def save_portfolio(self, proposal: dict[str, Any]) -> None:
        proposal["id"] = proposal.get("proposal_id", proposal.get("id"))
        await self.upsert("portfolios", proposal)

    async def get_portfolio(self, proposal_id: str, client_id: str) -> Optional[dict]:
        return await self.get("portfolios", proposal_id, client_id)

    async def get_portfolio_by_run_id(self, run_id: str) -> Optional[dict]:
        results = await self.query(
            "portfolios",
            "SELECT * FROM c WHERE c.run_id = @rid ORDER BY c.created_at DESC",
            [{"name": "@rid", "value": run_id}],
            max_items=1,
        )
        return results[0] if results else None

    async def list_portfolios_for_advisor(self, advisor_id: str) -> list[dict]:
        return await self.query(
            "portfolios",
            "SELECT * FROM c WHERE c.advisor_id = @aid ORDER BY c.created_at DESC",
            [{"name": "@aid", "value": advisor_id}],
        )

    async def list_portfolios_for_client(self, client_id: str) -> list[dict]:
        return await self.query(
            "portfolios",
            "SELECT * FROM c WHERE c.client_id = @cid ORDER BY c.created_at DESC",
            [{"name": "@cid", "value": client_id}],
        )

    # ── Audit Log ─────────────────────────────────────────────────────────────

    async def log_audit(self, entry: dict[str, Any]) -> None:
        entry["id"] = entry.get("entry_id", entry.get("id"))
        if "client_id" not in entry or not entry["client_id"]:
            entry["client_id"] = "system"
        await self.upsert("audit_log", entry)

    async def get_audit_log(
        self,
        client_id: Optional[str] = None,
        session_id: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        if client_id:
            q = "SELECT TOP @lim * FROM c WHERE c.client_id = @cid ORDER BY c.timestamp DESC"
            p = [{"name": "@cid", "value": client_id}, {"name": "@lim", "value": limit}]
        elif session_id:
            q = "SELECT TOP @lim * FROM c WHERE c.session_id = @sid ORDER BY c.timestamp DESC"
            p = [{"name": "@sid", "value": session_id}, {"name": "@lim", "value": limit}]
        else:
            q = "SELECT TOP @lim * FROM c ORDER BY c.timestamp DESC"
            p = [{"name": "@lim", "value": limit}]
        return await self.query("audit_log", q, p, max_items=limit)

    async def query_audit_log(
        self,
        client_id: Optional[str] = None,
        extra_client_ids: Optional[list[str]] = None,
        session_id: Optional[str] = None,
        advisor_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        """Filtered, paginated audit log used by the API router."""
        conditions: list[str] = []
        params: list[dict] = []
        if client_id:
            # Include audit entries stored under any linked prospect client_ids
            # (e.g. "prospect-XXXX" before the session was promoted to a real client).
            all_cids = [client_id] + [c for c in (extra_client_ids or []) if c and c != client_id]
            if len(all_cids) == 1:
                conditions.append("c.client_id = @client_id")
                params.append({"name": "@client_id", "value": client_id})
            else:
                or_parts = []
                for i, cid in enumerate(all_cids):
                    pname = f"@cid_{i}"
                    or_parts.append(f"c.client_id = {pname}")
                    params.append({"name": pname, "value": cid})
                conditions.append(f"({' OR '.join(or_parts)})")
        if session_id:
            conditions.append("c.session_id = @session_id")
            params.append({"name": "@session_id", "value": session_id})
        if advisor_id:
            conditions.append("c.advisor_id = @advisor_id")
            params.append({"name": "@advisor_id", "value": advisor_id})
        if event_type:
            conditions.append("c.event_type = @event_type")
            params.append({"name": "@event_type", "value": event_type})
        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        q = f"SELECT * FROM c {where} ORDER BY c.timestamp DESC OFFSET {offset} LIMIT {limit}"
        return await self.query("audit_log", q, params, max_items=limit)

    # ── Human-in-the-loop Checkpoints ────────────────────────────────────────

    async def save_checkpoint(self, checkpoint: dict[str, Any]) -> None:
        checkpoint["id"] = checkpoint.get("checkpoint_id", checkpoint.get("id"))
        if "workflow_id" not in checkpoint:
            checkpoint["workflow_id"] = checkpoint.get("run_id", "unknown")
        await self.upsert("checkpoints", checkpoint)

    async def get_pending_checkpoints(self) -> list[dict]:
        return await self.query(
            "checkpoints",
            "SELECT * FROM c WHERE c.status = 'awaiting_approval' AND c.workflow_type = 'portfolio' ORDER BY c.created_at DESC",
        )

    # ── Advisory Sessions ─────────────────────────────────────────────────────

    async def save_advisory_session(self, session: dict[str, Any]) -> None:
        session["id"] = session.get("advisory_id", session.get("id"))
        await self.upsert("advisory_sessions", session)

    async def list_advisory_sessions(self, advisor_id: str) -> list[dict]:
        return await self.query(
            "advisory_sessions",
            "SELECT * FROM c WHERE c.advisor_id = @aid ORDER BY c.created_at DESC",
            [{"name": "@aid", "value": advisor_id}],
        )

    async def list_briefings(
        self,
        advisor_id: str,
        client_id: Optional[str] = None,
        briefing_type: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        """Filtered briefing history by advisor, optionally by client and/or type."""
        conditions = ["c.advisor_id = @aid"]
        params: list[dict] = [{"name": "@aid", "value": advisor_id}]
        if client_id:
            conditions.append("c.client_id = @cid")
            params.append({"name": "@cid", "value": client_id})
        if briefing_type:
            conditions.append("c.type = @btype")
            params.append({"name": "@btype", "value": briefing_type})
        where = " AND ".join(conditions)
        q = f"SELECT * FROM c WHERE {where} ORDER BY c.created_at DESC OFFSET 0 LIMIT {limit}"
        return await self.query("advisory_sessions", q, params, max_items=limit)

    # ── Rebalance Reports ─────────────────────────────────────────────────────

    async def save_rebalance_report(self, report: dict[str, Any]) -> None:
        report["id"] = report.get("rebalance_id", report.get("id"))
        await self.upsert("rebalance_reports", report)

    async def list_rebalance_reports(
        self,
        client_id: str,
        portfolio_id: Optional[str] = None,
        limit: int = 20,
    ) -> list[dict]:
        conditions = ["c.client_id = @cid"]
        params: list[dict] = [{"name": "@cid", "value": client_id}]
        if portfolio_id:
            conditions.append("c.portfolio_id = @pid")
            params.append({"name": "@pid", "value": portfolio_id})
        where = " AND ".join(conditions)
        q = f"SELECT * FROM c WHERE {where} ORDER BY c.checked_at DESC OFFSET 0 LIMIT {limit}"
        return await self.query("rebalance_reports", q, params, max_items=limit)

    # ── Client Conversations ──────────────────────────────────────────────────

    async def save_conversation_turn(self, turn: dict[str, Any]) -> None:
        turn["id"] = turn.get("turn_id", turn.get("id"))
        await self.upsert("client_conversations", turn)

    async def get_conversation_history(
        self, client_id: str, limit: int = 20
    ) -> list[dict]:
        return await self.query(
            "client_conversations",
            "SELECT TOP @lim * FROM c WHERE c.client_id = @cid ORDER BY c.timestamp DESC",
            [{"name": "@cid", "value": client_id}, {"name": "@lim", "value": limit}],
            max_items=limit,
        )

    # ── Cascade Delete ────────────────────────────────────────────────────────

    async def delete_client_cascade(
        self, client_id: str, advisor_id: str
    ) -> Optional[dict[str, int]]:
        """
        Delete a client and every document associated with them across all
        collections.  Returns a dict of {collection: count_deleted}, or None
        if the client doesn't exist.
        """
        client = await self.get_client(client_id, advisor_id)
        if not client:
            return None

        deleted: dict[str, int] = {}

        # Collect all client_id values associated with this client, including
        # prospect IDs used before promotion (e.g. "prospect-XXXX").  Audit
        # entries logged during a prospect meeting carry the original prospect
        # client_id, so we must delete those too.
        sessions = await self.list_sessions_for_client(client_id)
        all_client_ids: set[str] = {client_id}
        for s in sessions:
            cid = s.get("client_id", "")
            if cid:
                all_client_ids.add(cid)

        # sessions — partitioned by /client_id, which may be prospect-XXXX for
        # pre-promotion sessions, so iterate ALL associated client IDs.
        session_count = 0
        for cid in all_client_ids:
            items = await self.query(
                "sessions",
                "SELECT c.id FROM c WHERE c.client_id = @cid",
                [{"name": "@cid", "value": cid}],
                max_items=1000,
            )
            for item in items:
                try:
                    await self.delete("sessions", item["id"], cid)
                    session_count += 1
                except Exception:
                    pass
        deleted["sessions"] = session_count

        # Collections where client_id is the partition key (no prospect ambiguity)
        for col in (
            "portfolios",
            "backtests",
            "rebalance_reports",
            "client_conversations",
        ):
            items = await self.query(
                col,
                "SELECT c.id FROM c WHERE c.client_id = @cid",
                [{"name": "@cid", "value": client_id}],
                max_items=1000,
            )
            count = 0
            for item in items:
                try:
                    await self.delete(col, item["id"], client_id)
                    count += 1
                except Exception:
                    pass
            deleted[col] = count

        # audit_log — delete entries for ALL associated client_ids (including
        # prospect IDs used before the client was promoted).
        audit_count = 0
        for cid in all_client_ids:
            items = await self.query(
                "audit_log",
                "SELECT c.id FROM c WHERE c.client_id = @cid",
                [{"name": "@cid", "value": cid}],
                max_items=1000,
            )
            for item in items:
                try:
                    await self.delete("audit_log", item["id"], cid)
                    audit_count += 1
                except Exception:
                    pass
        deleted["audit_log"] = audit_count

        # agent_audits partitioned by /run_id — query by client_id field
        items = await self.query(
            "agent_audits",
            "SELECT c.id, c.run_id FROM c WHERE c.client_id = @cid",
            [{"name": "@cid", "value": client_id}],
            max_items=1000,
        )
        count = 0
        for item in items:
            try:
                await self.delete("agent_audits", item["id"], item.get("run_id", item["id"]))
                count += 1
            except Exception:
                pass
        deleted["agent_audits"] = count

        # checkpoints partitioned by /workflow_id — query by client_id field
        # (may be prospect-XXXX for pre-promotion sessions, so iterate all IDs)
        checkpoint_count = 0
        for cid in all_client_ids:
            items = await self.query(
                "checkpoints",
                "SELECT c.id, c.workflow_id FROM c WHERE c.client_id = @cid",
                [{"name": "@cid", "value": cid}],
                max_items=1000,
            )
            for item in items:
                try:
                    await self.delete("checkpoints", item["id"], item.get("workflow_id", item["id"]))
                    checkpoint_count += 1
                except Exception:
                    pass
        deleted["checkpoints"] = checkpoint_count

        # Finally delete the client document itself (partitioned by /advisor_id)
        await self.delete("clients", client_id, advisor_id)
        deleted["client"] = 1

        return deleted


def _serialize(obj: Any) -> Any:
    """Recursively serialize Python objects to JSON-safe types for Cosmos DB."""
    if isinstance(obj, (dict, MappingProxyType)):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    if isinstance(obj, Enum):
        return obj.value
    if hasattr(obj, "model_dump"):
        return _serialize(obj.model_dump())
    if hasattr(obj, "__dict__"):
        return _serialize(vars(obj))
    return obj
