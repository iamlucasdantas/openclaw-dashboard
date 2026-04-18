"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type CronView = "calendar" | "agenda" | "list";

export async function setCronView(mode: CronView, currentPath: string) {
  const jar = await cookies();
  jar.set("openclaw_cron_view", mode, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(currentPath);
}

export async function getCronView(): Promise<CronView> {
  const jar = await cookies();
  const v = jar.get("openclaw_cron_view")?.value;
  if (v === "agenda" || v === "list") return v;
  return "calendar";
}
