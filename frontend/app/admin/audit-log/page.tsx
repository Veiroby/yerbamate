import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin-access";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const user = await getCurrentUser();
  if (!user || !hasAdminAccess(user)) notFound();

  const rows = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: { select: { email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Audit log</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Recent admin actions (last 200).{" "}
          <Link href="/admin" className="text-emerald-600 hover:underline">
            Dashboard
          </Link>
        </p>
      </div>
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-3 py-2 font-medium text-zinc-600">When</th>
                  <th className="px-3 py-2 font-medium text-zinc-600">Actor</th>
                  <th className="px-3 py-2 font-medium text-zinc-600">Action</th>
                  <th className="px-3 py-2 font-medium text-zinc-600">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/50">
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                      {r.createdAt.toLocaleString()}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-zinc-800">
                      {r.actor.email}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-900">{r.action}</td>
                    <td className="px-3 py-2 text-xs text-zinc-600">
                      {r.entityType}
                      {r.entityId ? (
                        <span className="ml-1 font-mono text-zinc-400">{r.entityId.slice(0, 8)}…</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
