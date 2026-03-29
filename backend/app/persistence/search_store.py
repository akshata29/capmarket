"""
Azure AI Search persistence layer for RAG (Retrieval-Augmented Generation).

Provides semantic search over client profiles, meeting transcripts, and documents.
Used by advisory and client service agents to retrieve relevant context.
"""
from __future__ import annotations

import logging
from typing import Any, Optional

from backend.config import get_settings

logger = logging.getLogger(__name__)


class SearchStore:
    """
    Wrapper around Azure AI Search for vector + keyword hybrid retrieval.
    Index management and upload handled here; agents call search() for RAG.
    """

    def __init__(self) -> None:
        s = get_settings()
        self._endpoint = s.azure_search_endpoint
        self._key = s.azure_search_key
        self._available = bool(self._endpoint and self._key)
        if not self._available:
            logger.warning("search_store_disabled: AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_KEY not set")

    def _get_client(self, index: str) -> Any:
        if not self._available:
            return None
        from azure.search.documents import SearchClient
        from azure.core.credentials import AzureKeyCredential
        return SearchClient(
            endpoint=self._endpoint,
            index_name=index,
            credential=AzureKeyCredential(self._key),
        )

    def _get_index_client(self) -> Any:
        if not self._available:
            return None
        from azure.search.documents.indexes import SearchIndexClient
        from azure.core.credentials import AzureKeyCredential
        return SearchIndexClient(
            endpoint=self._endpoint,
            credential=AzureKeyCredential(self._key),
        )

    async def search(
        self,
        index: str,
        query: str,
        filter_expr: Optional[str] = None,
        top: int = 5,
        select: Optional[list[str]] = None,
    ) -> list[dict[str, Any]]:
        """Hybrid keyword + semantic search. Returns top-k results."""
        if not self._available:
            return []
        try:
            client = self._get_client(index)
            results = client.search(
                search_text=query,
                filter=filter_expr,
                top=top,
                select=select,
                query_type="semantic",
                semantic_configuration_name="default",
            )
            return [dict(r) for r in results]
        except Exception as exc:
            logger.warning("search_failed index=%s error=%s", index, exc)
            return []

    async def upload_document(self, index: str, document: dict[str, Any]) -> None:
        """Upload or update a document in the specified index."""
        if not self._available:
            return
        try:
            client = self._get_client(index)
            client.upload_documents(documents=[document])
        except Exception as exc:
            logger.warning("upload_failed index=%s error=%s", index, exc)

    async def search_clients(
        self, query: str, advisor_id: Optional[str] = None, top: int = 5
    ) -> list[dict]:
        s = get_settings()
        filter_expr = f"advisor_id eq '{advisor_id}'" if advisor_id else None
        return await self.search(s.azure_search_index_clients, query, filter_expr, top)

    async def search_meetings(
        self, query: str, client_id: Optional[str] = None, top: int = 5
    ) -> list[dict]:
        s = get_settings()
        filter_expr = f"client_id eq '{client_id}'" if client_id else None
        return await self.search(s.azure_search_index_meetings, query, filter_expr, top)

    async def search_documents(
        self, query: str, client_id: Optional[str] = None, top: int = 5
    ) -> list[dict]:
        s = get_settings()
        filter_expr = f"client_id eq '{client_id}'" if client_id else None
        return await self.search(s.azure_search_index_documents, query, filter_expr, top)


_store: Optional[SearchStore] = None


def get_search_store() -> SearchStore:
    global _store
    if _store is None:
        _store = SearchStore()
    return _store
