import os
from dotenv import load_dotenv
from app.sources.yerbamate import YerbaMateClient

load_dotenv()
c = YerbaMateClient(
    os.environ["YERBAMATE_API_URL"],
    os.environ["YERBAMATE_AGENT_SECRET"],
)
orders = c.list_orders(limit=2)
print("orders", len(orders))
inv = c.inventory()
print("products", inv.get("totalProducts"))
print("low_stock", inv.get("lowStockCount"))
