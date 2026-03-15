import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
      <Sidebar />
      <main className="flex-1" style={{ marginLeft: "260px" }}>
        {children}
      </main>
    </div>
  );
}
