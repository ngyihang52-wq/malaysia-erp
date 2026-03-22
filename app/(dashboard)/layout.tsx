import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IBM_Plex_Sans } from "next/font/google";
import DashboardShell from "@/components/layout/DashboardShell";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className={ibmPlexSans.variable}>
      <DashboardShell>{children}</DashboardShell>
    </div>
  );
}
