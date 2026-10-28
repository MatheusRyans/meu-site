import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "site_admin_token";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const expected = process.env.ADMIN_PASSWORD ?? "admin";
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  return token === expected;
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
