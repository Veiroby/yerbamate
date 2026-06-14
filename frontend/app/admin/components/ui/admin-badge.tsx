import type { ReactNode } from "react";

export type AdminBadgeTone =
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "neutral"
  | "attention";

const toneClasses: Record<AdminBadgeTone, string> = {
  success: "bg-[var(--admin-accent-subdued)] text-[var(--admin-accent-text)]",
  warning: "bg-[var(--admin-warning-subdued)] text-[var(--admin-warning)]",
  critical: "bg-[var(--admin-critical-subdued)] text-[var(--admin-critical)]",
  info: "bg-[var(--admin-info-subdued)] text-[var(--admin-info)]",
  neutral: "bg-[var(--admin-surface-subdued)] text-[var(--admin-text-secondary)] ring-1 ring-[var(--admin-border)]",
  attention: "bg-[var(--admin-warning-subdued)] text-[var(--admin-warning)]",
};

export function AdminBadge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: AdminBadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium leading-4 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function orderStatusTone(status: string): AdminBadgeTone {
  if (status === "PAID" || status === "SHIPPED" || status === "PROCESSING") {
    return "success";
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return "neutral";
  }
  if (status === "REQUIRES_PAYMENT" || status === "PENDING") {
    return "attention";
  }
  return "warning";
}

export function formatOrderStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
