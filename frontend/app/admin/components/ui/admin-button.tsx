import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "plain" | "critical";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--admin-primary)] text-[var(--admin-primary-text)] shadow-sm hover:bg-[var(--admin-primary-hover)]",
  secondary:
    "border border-[var(--admin-border-strong)] bg-[var(--admin-surface)] text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)]",
  plain:
    "bg-transparent text-[var(--admin-text)] hover:bg-[var(--admin-surface-hover)]",
  critical:
    "bg-[var(--admin-critical)] text-white hover:opacity-90",
};

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50";

export function AdminButton({
  variant = "secondary",
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`${base} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminButtonLink({
  href,
  variant = "secondary",
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
