import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import LandingPage from "./_components/LandingPage";

/**
 * Root page — server component.
 * If the visitor has a valid auth token, send them straight to the
 * dashboard so they don't have to re-login after typing the domain.
 * Otherwise render the public landing page.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      redirect("/dashboard");
    }
  }

  return <LandingPage />;
}
