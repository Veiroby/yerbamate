import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPage({
  title,
  subtitle,
  actions,
  children,
  narrow,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`space-y-5 ${narrow ? "max-w-3xl" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--admin-text)] sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function AdminCard({
  title,
  subtitle,
  actions,
  children,
  flush,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={`admin-card overflow-hidden ${className}`}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3 sm:px-5">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold text-[var(--admin-text)]">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--admin-text-secondary)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={flush ? "" : "admin-card-padded"}>{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-medium text-[var(--admin-text-secondary)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-xs text-[var(--admin-text-subdued)]">{sub}</p>
      ) : null}
    </>
  );

  const className =
    "admin-card admin-card-padded block transition hover:shadow-md hover:ring-1 hover:ring-[var(--admin-border)]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
