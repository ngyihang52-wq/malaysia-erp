"use client";

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Shield, Eye, EyeOff, Loader2, X, Trash2 } from 'lucide-react';

const roles = ['Admin', 'Manager', 'Staff', 'Read-only'];

const roleStyle: Record<string, { color: string; bg: string }> = {
  Admin: { color: '#000080', bg: '#E8F0FF' },
  Manager: { color: '#6D8196', bg: '#EEF5FF' },
  Staff: { color: '#4A7B5F', bg: '#EEF5F1' },
  'Read-only': { color: '#8AAFC8', bg: '#F0F5FF' },
};

const permissions: Record<string, string[]> = {
  Admin: ['Dashboard', 'Orders', 'Products', 'Inventory', 'Customers', 'Users', 'Integrations', 'SQL Console'],
  Manager: ['Dashboard', 'Orders', 'Products', 'Inventory', 'Customers', 'Integrations'],
  Staff: ['Dashboard', 'Orders', 'Products', 'Inventory'],
  'Read-only': ['Dashboard'],
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

export default function Users() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'Staff' });
  const [submitting, setSubmitting] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddForm(false);
        setAddForm({ name: '', email: '', password: '', role: 'Staff' });
        await fetchUsers();
      }
    } catch (err) {
      console.error('Failed to add user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setChangingRole(userId);
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Remove this user?')) return;
    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error('Failed to remove user:', err);
    }
  };

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Access Control</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Users
          </h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2"
          style={{ background: '#000080' }}
        >
          <UserPlus size={11} />
          Invite User
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="mb-4 bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>New User</p>
            <button onClick={() => setShowAddForm(false)} className="text-[#6D8196] hover:opacity-70">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 text-[11px] outline-none"
              style={{ border: '1px solid #C8DFF0', color: '#1A2540' }}
            />
            <input
              type="email"
              placeholder="Email"
              value={addForm.email}
              onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 text-[11px] outline-none"
              style={{ border: '1px solid #C8DFF0', color: '#1A2540' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={addForm.password}
              onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              className="px-3 py-2 text-[11px] outline-none"
              style={{ border: '1px solid #C8DFF0', color: '#1A2540' }}
            />
            <div className="flex gap-2">
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className="flex-1 px-2 py-2 text-[11px] outline-none"
                style={{ border: '1px solid #C8DFF0', color: '#1A2540' }}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={handleAddUser}
                disabled={submitting}
                className="px-4 py-2 text-white text-[10px] tracking-[0.1em] uppercase disabled:opacity-50"
                style={{ background: '#000080' }}
              >
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Users table */}
        <div className="col-span-2">
          <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                  {['User', 'Email', 'Role', 'Joined', ''].map((h) => (
                    <th
                      key={h || 'actions'}
                      className="text-left px-5 py-3 font-normal text-[9px] tracking-[0.15em] uppercase"
                      style={{ color: '#6D8196' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" style={{ color: '#6D8196' }} />
                        <span className="text-[11px]" style={{ color: '#6D8196' }}>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <span className="text-[11px]" style={{ color: '#6D8196' }}>No users yet</span>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors group"
                      style={{ borderBottom: '1px solid #F5F9FF' }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0"
                            style={{ background: '#6D8196' }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-xs" style={{ color: '#1A2540' }}>{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[10px]" style={{ color: '#4A6080' }}>{user.email}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={user.role}
                          disabled={changingRole === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase appearance-none cursor-pointer outline-none border-none"
                          style={{
                            color: (roleStyle[user.role] || roleStyle['Staff']).color,
                            background: (roleStyle[user.role] || roleStyle['Staff']).bg,
                            opacity: changingRole === user.id ? 0.5 : 1,
                          }}
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td
                        className="px-5 py-3.5 text-[10px]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                      >
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                          style={{ color: '#C8DFF0' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role permissions panel */}
        <div className="space-y-3">
          <div className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={12} style={{ color: '#6D8196' }} />
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Role Permissions</p>
            </div>
            <div className="space-y-1.5 mb-4">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors"
                  style={{
                    background: selectedRole === role ? '#000080' : '#F0F8FF',
                    color: selectedRole === role ? '#FFFFFF' : '#6D8196',
                  }}
                >
                  <span className="text-[11px] tracking-wide">{role}</span>
                  <span
                    className="text-[10px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {permissions[role].length}
                  </span>
                </button>
              ))}
            </div>

            {selectedRole && (
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: '#6D8196' }}>
                  {selectedRole} Access
                </p>
                <div className="space-y-1.5">
                  {['Dashboard', 'Orders', 'Products', 'Inventory', 'Customers', 'Users', 'Integrations', 'SQL Console'].map((module) => {
                    const hasAccess = permissions[selectedRole].includes(module);
                    return (
                      <div
                        key={module}
                        className="flex items-center justify-between py-1.5"
                        style={{ borderBottom: '1px solid #EEF5FF' }}
                      >
                        <span className="text-[11px]" style={{ color: hasAccess ? '#000080' : '#C8DFF0' }}>
                          {module}
                        </span>
                        {hasAccess ? (
                          <Eye size={11} style={{ color: '#ADD8E6' }} />
                        ) : (
                          <EyeOff size={11} style={{ color: '#E8F4FF' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
