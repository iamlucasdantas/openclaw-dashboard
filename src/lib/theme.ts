import { cookies } from "next/headers";

export type Theme = "light" | "dark";
export const THEME_COOKIE = "openclaw_theme";

export async function getTheme(): Promise<Theme> {
  const jar = await cookies();
  const raw = jar.get(THEME_COOKIE)?.value;
  return raw === "dark" ? "dark" : "light";
}
