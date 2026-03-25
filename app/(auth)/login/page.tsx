import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

// Never cache — must read the live cookie on every request
export const dynamic = "force-dynamic";

/**
 * Login page — server component wrapper.
 * If the user already has an auth cookie, skip the login form and
 * redirect straight to the dashboard.
 */
export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
