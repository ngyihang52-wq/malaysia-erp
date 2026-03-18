"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

const ROLES = ["ADMIN", "MANAGER", "STAFF"];

function getRoleBadge(role: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    SUPER_ADMIN: { bg: "rgba(168,85,247,0.15)", color: "#d8b4fe" },
    ADMIN: { bg: "rgba(220,38,38,0.15)", color: "#fca5a5" },
    MANAGER: { bg: "rgba(37,99,235,0.15)", color: "#93c5fd" },
    STAFF: { bg: "rgba(22,163,74,0.15)", color: "#86efac" },
  };
  const s = styles[role] || styles.STAFF;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {role}
    </span>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });

  const fetchUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => { setUsers(d.data || []); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Failed to create user"); return; }
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      fetchUsers();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    fetchUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Remove this user from your organization?")) return;
    await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
    fetchUsers();
  };

  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>Team Members</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Manage users in your organization</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="erp-btn erp-btn-primary"
          >
            + Invite User
          </button>
        )}
      </div>

      {/* Table */}
      <div className="erp-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#64748b" }}>Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "#64748b" }}>No users found. Invite your first team member.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Name", "Email", "Role", "Joined", isAdmin ? "Actions" : ""].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: "#2563eb" }}>
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm" style={{ color: "#0f172a" }}>{u.name || "—"}</span>
                      {u.id === currentUser?.id && <span className="text-xs" style={{ color: "#94a3b8" }}>(you)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#475569" }}>{u.email}</td>
                  <td className="px-6 py-4">
                    {isAdmin && u.id !== currentUser?.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs rounded px-2 py-1 border"
                        style={{ borderColor: "#e2e8f0", color: "#374151" }}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      getRoleBadge(u.role)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#94a3b8" }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-xs px-3 py-1 rounded"
                          style={{ background: "#fef2f2", color: "#dc2626" }}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="erp-card w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "#0f172a" }}>Invite Team Member</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Full Name</label>
                <input
                  type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="erp-input" placeholder="John Doe" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Email Address</label>
                <input
                  type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="erp-input" placeholder="john@company.com" required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Temporary Password</label>
                <input
                  type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="erp-input" placeholder="Min. 8 characters" required minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>Role</label>
                <select
                  value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="erp-input"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="erp-btn erp-btn-primary flex-1 justify-center" style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "Create User"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setError(""); }} className="erp-btn flex-1 justify-center" style={{ background: "#f1f5f9", color: "#374151" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
