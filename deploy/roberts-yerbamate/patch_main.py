from pathlib import Path

main = Path("/opt/roberts/Roberts2.0/app/main.py")
text = main.read_text(encoding="utf-8")

if 'app.bot_data["yerbamate"]' not in text:
    text = text.replace(
        '    app.bot_data["tzinfo"] = config.tzinfo\n\n    eb = banking_client(config)',
        '    app.bot_data["tzinfo"] = config.tzinfo\n\n'
        '    yerbamate = None\n'
        '    if config.yerbamate_enabled:\n'
        '        yerbamate = YerbaMateClient(config.yerbamate_api_url, config.yerbamate_agent_secret)\n'
        '        log.info("YerbaTea integration enabled at %s", config.yerbamate_api_url)\n'
        '    else:\n'
        '        log.info("YerbaTea integration disabled (set YERBAMATE_API_URL + YERBAMATE_AGENT_SECRET)")\n'
        '    app.bot_data["yerbamate"] = yerbamate\n\n'
        '    eb = banking_client(config)',
    )

if "poll_new_orders_job" not in text:
    text = text.replace(
        '    sync_jobs(app, app.bot_data["db"], app.bot_data["perplexity"])\n'
        '    config = app.bot_data["config"]',
        '    sync_jobs(app, app.bot_data["db"], app.bot_data["perplexity"])\n'
        '    if app.bot_data.get("yerbamate") and app.job_queue:\n'
        '        app.job_queue.run_repeating(\n'
        '            ym.poll_new_orders_job,\n'
        '            interval=300,\n'
        '            first=45,\n'
        '            name="yerbamate-orders",\n'
        '        )\n'
        '        log.info("YerbaTea new-order notifications every 5 minutes")\n'
        '    config = app.bot_data["config"]',
    )

if "ym.cmd_orders" not in text:
    insert = (
        '    app.add_handler(CommandHandler("orders", ym.cmd_orders))\n'
        '    app.add_handler(CommandHandler("order", ym.cmd_order))\n'
        '    app.add_handler(CommandHandler("dpd", ym.cmd_dpd))\n'
        '    app.add_handler(CommandHandler("stock", ym.cmd_stock))\n'
        '    app.add_handler(CommandHandler("stockset", ym.cmd_stockset))\n'
        '    app.add_handler(CommandHandler("stockanalyze", ym.cmd_stockanalyze))\n'
    )
    text = text.replace(
        '    app.add_handler(CommandHandler("reset", tb.cmd_reset))\n',
        '    app.add_handler(CommandHandler("reset", tb.cmd_reset))\n' + insert,
    )

main.write_text(text, encoding="utf-8")
print("main.py updated")
