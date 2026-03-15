import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLocalePrefixForRedirect, isValidLocale } from "@/lib/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AccountInformationPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) return null;
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/account/profile`);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black sm:text-3xl">
          Account Information
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your name and contact details.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-black">Personal details</h2>
        <form
          action={async (formData) => {
            "use server";
            const name = formData.get("name")?.toString().trim() || null;
            const { getCurrentUser } = await import("@/lib/auth");
            const currentUser = await getCurrentUser();
            if (!currentUser) throw new Error("Unauthorized");
            const p = await getLocalePrefixForRedirect();
            await prisma.user.update({
              where: { id: currentUser.id },
              data: { name },
            });
            revalidatePath(p + "/account/information");
            redirect(p + "/account/information?saved=1");
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={user.name ?? ""}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}
