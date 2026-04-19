export default function AdminLoading() {
  return (
    <div className="min-h-[40vh] animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded-lg bg-zinc-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-zinc-200" />
    </div>
  );
}
