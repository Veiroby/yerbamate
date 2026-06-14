"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Home",
  "/admin/analytics": "Analytics",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/collections": "Collections",
  "/admin/orders": "Orders",
  "/admin/abandoned-carts": "Abandoned checkouts",
  "/admin/invoices": "Invoices",
  "/admin/inventory": "Inventory",
  "/admin/shipping": "Shipping and delivery",
  "/admin/customers": "Customers",
  "/admin/reviews": "Reviews",
  "/admin/email": "Marketing",
  "/admin/blog": "Blog posts",
  "/admin/discounts": "Discounts",
  "/admin/main-page": "Online store",
  "/admin/privacy": "Policies",
  "/admin/languages": "Languages",
  "/admin/audit-log": "Audit log",
  "/admin/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/admin/orders/")) return "Order details";
  if (pathname.startsWith("/admin/products/")) return "Edit product";
  if (pathname.startsWith("/admin/customers/")) return "Customer";
  if (pathname.startsWith("/admin/collections/")) return "Collection";
  if (pathname.startsWith("/admin/categories/")) return "Category";
  if (pathname.startsWith("/admin/blog/")) return "Blog post";
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (path !== "/admin" && pathname.startsWith(path)) return title;
  }
  return "Admin";
}

export function AdminPageTitle() {
  const pathname = usePathname();
  return <>{resolveTitle(pathname)}</>;
}
