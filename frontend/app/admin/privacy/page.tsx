import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default function AdminPrivacyPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Privacy policy
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Edit and publish your store’s privacy policy. This content can be
          shown on a public /privacy page.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <form
          action={async (formData) => {
            "use server";
            // Placeholder: persist privacy policy (e.g. in DB or CMS) in a future release
            revalidatePath("/admin/privacy");
            redirect("/admin/privacy?saved=1");
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Privacy policy (HTML or plain text)
            </label>
            <textarea
              name="content"
              rows={16}
              placeholder="Enter your privacy policy content here. You can use plain text or HTML. Saving will be wired to storage in a future release."
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Save privacy policy
          </button>
        </form>
        <p className="mt-3 text-xs text-zinc-500">
          Tip: Add a link to /privacy in your store footer so customers can
          view this policy.
        </p>
      </section>
    </div>
  );
}
