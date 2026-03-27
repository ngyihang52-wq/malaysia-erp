import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import RegisterForm from "./RegisterForm";

// Never cache — must read the live cookie on every request
export const dynamic = "force-dynamic";

/**
 * Register page — server component wrapper.
 * If the user already has an auth cookie, skip the form and
 * redirect straight to the dashboard.
 */
export default async function RegisterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <RegisterForm />;
}
