import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "#e2e8f0",
      padding: "24px",
    }}>
      {/* Logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: "#2563eb",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24,
        boxShadow: "0 8px 32px rgba(37,99,235,0.4)",
      }}>
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0, letterSpacing: -1, textAlign: "center" }}>
        Nexa<span style={{ color: "#2563eb" }}>ERP</span>
      </h1>
      <p style={{ color: "#94a3b8", fontSize: 16, marginTop: 10, marginBottom: 48, textAlign: "center" }}>
        Multi-Channel Commerce Platform for Southeast Asia
      </p>

      {/* Platform badges */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 56 }}>
        {[
          { name: "Shopify", color: "#96BF48" },
          { name: "TikTok", color: "#ff0050" },
          { name: "Shopee", color: "#EE4D2D" },
          { name: "Lazada", color: "#0F146D" },
          { name: "Amazon", color: "#FF9900" },
        ].map((p) => (
          <span key={p.name} style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: `${p.color}22`, color: p.color,
            border: `1px solid ${p.color}44`,
          }}>{p.name}</span>
        ))}
      </div>

      {/* Feature grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
        maxWidth: 640, width: "100%", marginBottom: 48,
      }}>
        {[
          { icon: "📊", label: "Unified Analytics" },
          { icon: "📦", label: "Order Management" },
          { icon: "🏷️", label: "Product Catalogue" },
          { icon: "🤖", label: "AI Insights Bot" },
          { icon: "👥", label: "Customer Hub" },
          { icon: "🗃️", label: "SQL Workspace" },
        ].map((f) => (
          <div key={f.label} style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "16px 12px",
            textAlign: "center", fontSize: 13, color: "#94a3b8",
          }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            {f.label}
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link href="/login" style={{
        display: "inline-block",
        padding: "14px 48px", borderRadius: 12,
        background: "#2563eb",
        color: "#fff", fontSize: 16, fontWeight: 700,
        textDecoration: "none",
        boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
        transition: "all 0.2s",
      }}>
        Sign In to Dashboard →
      </Link>

      <p style={{ marginTop: 16, fontSize: 12, color: "#475569" }}>
        © 2026 NexaCommerce SEA · <a href="https://nexa-erp.com" style={{ color: "#475569" }}>nexa-erp.com</a>
      </p>
    </div>
  );
}
