import { revalidatePath } from "next/cache";

/** Refresh the public shop after a catalog change. */
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
