from pathlib import Path

tb = Path("/opt/roberts/Roberts2.0/app/telegram_bot.py")
text = tb.read_text(encoding="utf-8")
text = text.replace(
    "from .yerbamate_actions import try_yerbamate_message\n",
    "",
)

if "try_yerbamate_message" not in text:
    text = text.replace(
        "    if await _try_bank_request(update, context, text):\n"
        "        return\n"
        "    await _handle_question(update, context, text)\n",
        "    if await _try_bank_request(update, context, text):\n"
        "        return\n"
        "    from .yerbamate_actions import try_yerbamate_message\n"
        "    if await try_yerbamate_message(update, context, text):\n"
        "        return\n"
        "    await _handle_question(update, context, text)\n",
    )

help_block = (
    "/orders [status] \\u2014 YerbaTea shop orders\\n"
    "/order <number> \\u2014 order details\\n"
    "/dpd <number> \\u2014 create & send DPD label PDF\\n"
    "/stock \\u2014 inventory summary\\n"
    "/stockset <product> <qty> \\u2014 fix stock level\\n"
    "/stockanalyze \\u2014 AI stock recommendations\\n"
)

if "/orders [status]" not in text:
    text = text.replace(
        "/reset \\u2014 clear conversation memory\\n",
        "/reset \\u2014 clear conversation memory\\n" + help_block,
    )

tb.write_text(text, encoding="utf-8")
print("telegram_bot.py updated")
