import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "./_components/LandingPage";

// Never cache — must read the live cookie on every request
export const dynamic = "force-dynamic";

/**
 * Root page — server component.
 * If the visitor has an auth cookie (same check as the dashboard
 * layout), redirect straight to /dashboard.  Token validity is
 * enforced downstream by the dashboard layout + API routes.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
