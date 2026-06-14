"""HTTP client for YerbaTea agent API (/api/agent/*)."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

import httpx

log = logging.getLogger(__name__)


class YerbaMateError(Exception):
    pass


class YerbaMateClient:
    def __init__(self, base_url: str, secret: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.secret = secret.strip()

    def enabled(self) -> bool:
        return bool(self.base_url and self.secret)

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.secret}"}

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        url = f"{self.base_url}{path}"
        try:
            with httpx.Client(timeout=90.0) as client:
                resp = client.request(method, url, headers=self._headers(), **kwargs)
        except httpx.HTTPError as exc:
            raise YerbaMateError(f"Could not reach YerbaTea: {exc}") from exc

        if resp.status_code == 401:
            raise YerbaMateError("Unauthorized — check YERBAMATE_AGENT_SECRET matches yerbamate .env")
        if resp.status_code >= 400:
            try:
                payload = resp.json()
                detail = payload.get("error") or payload
            except Exception:
                detail = resp.text[:300]
            raise YerbaMateError(f"YerbaTea API {resp.status_code}: {detail}")

        return resp.json()

    def list_orders(self, status: str | None = None, limit: int = 15) -> list[dict]:
        params: dict[str, Any] = {"limit": limit}
        if status:
            params["status"] = status
        data = self._request("GET", "/api/agent/orders", params=params)
        return list(data.get("orders") or [])

    def new_orders_since(self, since: datetime, limit: int = 20) -> list[dict]:
        params = {"since": since.isoformat(), "limit": limit}
        data = self._request("GET", "/api/agent/orders", params=params)
        return list(data.get("orders") or [])

    def get_order(self, id_or_number: str) -> dict:
        data = self._request("GET", f"/api/agent/orders/{id_or_number}")
        return data["order"]

    def create_dpd_label(self, id_or_number: str) -> dict:
        return self._request("POST", f"/api/agent/orders/{id_or_number}/dpd-label")

    def inventory(self, low: int = 3) -> dict:
        return self._request("GET", "/api/agent/inventory", params={"low": low})

    def adjust_stock(self, query: str, quantity: int, reason: str | None = None) -> dict:
        body: dict[str, Any] = {"query": query, "quantity": quantity}
        if reason:
            body["reason"] = reason
        return self._request("POST", "/api/agent/inventory/adjust", json=body)
