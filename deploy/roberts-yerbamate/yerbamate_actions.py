"""Telegram commands and natural-language hooks for YerbaTea shop control."""

from __future__ import annotations

import base64
import functools
import io
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Awaitable, Callable

from telegram import Update
from telegram.ext import ContextTypes

from .perplexity import PerplexityClient, PerplexityError
from .reporting import send_long
from .sources.yerbamate import YerbaMateClient, YerbaMateError

HandlerFn = Callable[[Update, ContextTypes.DEFAULT_TYPE], Awaitable[None]]


def owner_only(func: HandlerFn) -> HandlerFn:
    @functools.wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        config = context.application.bot_data["config"]
        user_id = update.effective_user.id if update.effective_user else None
        if not config.is_allowed(user_id):
            if update.effective_message:
                await update.effective_message.reply_text("Sorry, this is a private bot.")
            return
        await func(update, context)

    return wrapper

log = logging.getLogger(__name__)

STATE_FILE = Path("yerbamate_state.json")

_STOCK_SET = re.compile(
    r"(?:set|update|fix)\s+(?:stock\s+(?:of|for)\s+)?(.+?)\s+(?:to|=)\s*(\d+)",
    re.I,
)
_DPD_LABEL = re.compile(
    r"(?:send|get|create|make)\s+(?:me\s+)?(?:a\s+)?dpd\s+label(?:\s+for)?\s+(?:order\s+)?([A-Za-z0-9-]+)",
    re.I,
)
_NEW_ORDERS = re.compile(
    r"\b(?:any\s+)?new\s+orders?\b|\borders?\s+today\b|\bunshipped\s+orders?\b",
    re.I,
)


def _client(context: ContextTypes.DEFAULT_TYPE) -> YerbaMateClient | None:
    return context.application.bot_data.get("yerbamate")


def _state_path(context: ContextTypes.DEFAULT_TYPE) -> Path:
    db_path = context.application.bot_data["db"].path
    return Path(db_path).parent / STATE_FILE.name


def _load_state(context: ContextTypes.DEFAULT_TYPE) -> dict[str, Any]:
    path = _state_path(context)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_state(context: ContextTypes.DEFAULT_TYPE, state: dict[str, Any]) -> None:
    path = _state_path(context)
    path.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _fmt_order_line(order: dict) -> str:
    total = order.get("total")
    currency = order.get("currency") or "EUR"
    shipping = order.get("shipping") or {}
    dest = shipping.get("dpdPickupPointName") or shipping.get("city") or ""
    return (
        f"• **{order.get('orderNumber')}** — {order.get('status')} — "
        f"{total} {currency} — {order.get('email')}"
        + (f" — {dest}" if dest else "")
    )


def _decode_label(label_b64: str) -> tuple[bytes, str]:
    raw = base64.b64decode(label_b64)
    if raw.startswith(b"%PDF"):
        return raw, "dpd-label.pdf"
    return raw, "dpd-label.txt"


async def _send_label_document(
    update: Update, context: ContextTypes.DEFAULT_TYPE, label_b64: str, caption: str
) -> None:
    data, filename = _decode_label(label_b64)
    await context.bot.send_document(
        chat_id=update.effective_user.id,
        document=io.BytesIO(data),
        filename=filename,
        caption=caption,
    )


@owner_only
async def cmd_orders(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client = _client(context)
    if not client:
        await update.effective_message.reply_text("YerbaTea is not configured on this bot.")
        return

    status = context.args[0].upper() if context.args else "PAID,PROCESSING,PENDING"
    await context.bot.send_chat_action(chat_id=update.effective_user.id, action="typing")
    try:
        orders = client.list_orders(status=status, limit=15)
    except YerbaMateError as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")
        return

    if not orders:
        await update.effective_message.reply_text(f"No orders with status {status}.")
        return

    lines = [f"📦 **YerbaTea orders** ({status})", ""]
    lines.extend(_fmt_order_line(o) for o in orders)
    await send_long(context.bot, update.effective_user.id, "\n".join(lines))


@owner_only
async def cmd_order(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client = _client(context)
    if not client:
        await update.effective_message.reply_text("YerbaTea is not configured on this bot.")
        return

    if not context.args:
        await update.effective_message.reply_text("Usage: /order <order number>")
        return

    ref = context.args[0]
    await context.bot.send_chat_action(chat_id=update.effective_user.id, action="typing")
    try:
        order = client.get_order(ref)
    except YerbaMateError as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")
        return

    items = order.get("items") or []
    item_lines = [
        f"  - {it.get('quantity')}× {it.get('productName')} ({it.get('total')} {order.get('currency')})"
        for it in items
    ]
    ship = order.get("shipping") or {}
    msg = (
        f"📦 **Order {order.get('orderNumber')}**\n"
        f"Status: {order.get('status')}\n"
        f"Customer: {order.get('email')}\n"
        f"Total: {order.get('total')} {order.get('currency')}\n"
        f"DPD label: {'yes' if order.get('hasDpdLabel') else 'no'}\n"
    )
    if order.get("dpdTrackingNumber"):
        msg += f"Tracking: {order.get('dpdTrackingNumber')}\n"
    if ship.get("dpdPickupPointName"):
        msg += f"Pickup: {ship.get('dpdPickupPointName')}\n"
    elif ship.get("city"):
        msg += f"Ship to: {ship.get('name')}, {ship.get('city')}, {ship.get('country')}\n"
    if item_lines:
        msg += "\nItems:\n" + "\n".join(item_lines)
    await send_long(context.bot, update.effective_user.id, msg)


@owner_only
async def cmd_dpd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client = _client(context)
    if not client:
        await update.effective_message.reply_text("YerbaTea is not configured on this bot.")
        return

    if not context.args:
        await update.effective_message.reply_text("Usage: /dpd <order number>")
        return

    ref = context.args[0]
    await update.effective_message.reply_text(f"Creating DPD label for {ref}…")
    try:
        result = client.create_dpd_label(ref)
        label = result.get("labelPdf")
        if not label:
            await update.effective_message.reply_text("No label returned from YerbaTea.")
            return
        caption = (
            f"DPD label for {ref}\n"
            f"Tracking: {result.get('trackingNumber') or 'n/a'}"
        )
        await _send_label_document(update, context, label, caption)
    except YerbaMateError as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")


@owner_only
async def cmd_stock(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client = _client(context)
    if not client:
        await update.effective_message.reply_text("YerbaTea is not configured on this bot.")
        return

    await context.bot.send_chat_action(chat_id=update.effective_user.id, action="typing")
    try:
        data = client.inventory(low=3)
    except YerbaMateError as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")
        return

    low = data.get("lowStock") or []
    out = data.get("outOfStock") or []
    lines = [
        "📊 **YerbaTea stock**",
        f"Low stock (≤{data.get('threshold')}): {data.get('lowStockCount')}",
        f"Out of stock: {data.get('outOfStockCount')}",
        "",
    ]
    if out:
        lines.append("**Out of stock:**")
        for row in out[:20]:
            lines.append(f"• {row.get('name')} — 0")
        lines.append("")
    if low:
        lines.append("**Low stock:**")
        for row in low[:25]:
            lines.append(f"• {row.get('name')} — {row.get('quantity')}")
    if not low and not out:
        lines.append("All tracked products look healthy.")
    await send_long(context.bot, update.effective_user.id, "\n".join(lines))


@owner_only
async def cmd_stockset(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client = _client(context)
    if not client:
        await update.effective_message.reply_text("YerbaTea is not configured on this bot.")
        return

    if len(context.args) < 2:
        await update.effective_message.reply_text(
            "Usage: /stockset <product name or barcode> <quantity>"
        )
        return

    qty = int(context.args[-1])
    query = " ".join(context.args[:-1])
    try:
        result = client.adjust_stock(query, qty, reason="telegram_stockset")
    except (ValueError, YerbaMateError) as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")
        return

    product = result.get("product") or {}
    await update.effective_message.reply_text(
        f"✅ **{product.get('name')}** stock: {result.get('before')} → {result.get('after')}"
    )


@owner_only
async def cmd_stockanalyze(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    client = _client(context)
    perplexity: PerplexityClient = context.application.bot_data["perplexity"]
    if not client:
        await update.effective_message.reply_text("YerbaTea is not configured on this bot.")
        return

    await update.effective_message.reply_text("Analyzing YerbaTea stock…")
    try:
        data = client.inventory(low=3)
    except YerbaMateError as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")
        return

    products = data.get("products") or []
    compact = [
        f"{p.get('name')} | qty={p.get('quantity')} | barcode={p.get('barcode') or '-'}"
        for p in products
    ]
    prompt = (
        "You are a warehouse assistant for an online yerba mate shop. "
        "Review this inventory list and give concise recommendations: "
        "what is critically low, what may be overstocked, and 3 concrete restock actions. "
        "Do not invent products not in the list.\n\n"
        + "\n".join(compact[:80])
    )
    try:
        analysis = await perplexity.ask(prompt)
    except PerplexityError as exc:
        await update.effective_message.reply_text(f"⚠️ {exc}")
        return
    await send_long(context.bot, update.effective_user.id, f"📊 **Stock analysis**\n\n{analysis}")


async def poll_new_orders_job(context: ContextTypes.DEFAULT_TYPE) -> None:
    client: YerbaMateClient | None = context.bot_data.get("yerbamate")
    config = context.bot_data.get("config")
    if not client or not config:
        return

    user_ids = list(config.allowed_user_ids)
    if not user_ids:
        return

    state = _load_state(context)
    last_raw = state.get("last_order_poll_at")
    now = datetime.now(timezone.utc)
    if last_raw:
        try:
            since = datetime.fromisoformat(last_raw)
        except ValueError:
            since = now
    else:
        since = now

    try:
        orders = client.new_orders_since(since)
    except YerbaMateError as exc:
        log.warning("YerbaTea order poll failed: %s", exc)
        return

    state["last_order_poll_at"] = now.isoformat()
    _save_state(context, state)

    if not orders:
        return

    lines = ["🛒 **New YerbaTea orders**", ""]
    lines.extend(_fmt_order_line(o) for o in orders)
    text = "\n".join(lines)
    for uid in user_ids:
        try:
            await send_long(context.bot, uid, text)
        except Exception as exc:
            log.warning("Could not notify user %s: %s", uid, exc)


def looks_like_yerbamate_request(text: str) -> bool:
    low = text.lower()
    if _NEW_ORDERS.search(text):
        return True
    if _DPD_LABEL.search(text):
        return True
    if _STOCK_SET.search(text):
        return True
    keywords = ("yerbatea", "yerbamate", "dpd label", "shop stock", "shop order")
    return any(k in low for k in keywords)


async def try_yerbamate_message(
    update: Update, context: ContextTypes.DEFAULT_TYPE, text: str
) -> bool:
    client = _client(context)
    if not client or not looks_like_yerbamate_request(text):
        return False

    if _NEW_ORDERS.search(text):
        since = datetime.now(timezone.utc) - timedelta(hours=24)
        try:
            orders = client.new_orders_since(since)
        except YerbaMateError as exc:
            await update.effective_message.reply_text(f"⚠️ {exc}")
            return True
        if not orders:
            await update.effective_message.reply_text("No new YerbaTea orders in the last 24 hours.")
            return True
        lines = ["🛒 **YerbaTea orders (last 24h)**", ""]
        lines.extend(_fmt_order_line(o) for o in orders)
        await send_long(context.bot, update.effective_user.id, "\n".join(lines))
        return True

    m = _DPD_LABEL.search(text)
    if m:
        context.args = [m.group(1)]
        await cmd_dpd(update, context)
        return True

    m = _STOCK_SET.search(text)
    if m:
        context.args = [m.group(1).strip(), m.group(2)]
        await cmd_stockset(update, context)
        return True

    low = text.lower()
    if "stock" in low or "inventory" in low:
        await cmd_stock(update, context)
        return True
    if "order" in low:
        await cmd_orders(update, context)
        return True

    return False
