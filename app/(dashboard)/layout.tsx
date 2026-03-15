import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("erp_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
      <Sidebar />
      <main className="flex-1" style={{ marginLeft: "260px" }}>
        {children}
      </main>
    </div>
  );
}
