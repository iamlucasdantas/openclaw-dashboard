"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setCronView(mode: "agenda" | "list", currentPath: string) {
  const jar = await cookies();
  jar.set("openclaw_cron_view", mode, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(currentPath);
}

export async function getCronView(): Promise<"agenda" | "list"> {
  const jar = await cookies();
  const v = jar.get("openclaw_cron_view")?.value;
  return v === "list" ? "list" : "agenda";
}
