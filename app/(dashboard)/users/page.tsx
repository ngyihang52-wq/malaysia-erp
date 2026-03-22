"use client";

import { useState } from 'react';
import { UserPlus, Shield, Eye, EyeOff } from 'lucide-react';

const users = [
  { id: 'USR-001', name: 'Test Admin', email: 'admin@malaysia-erp.com', role: 'Admin', lastActive: '20 Mar 2026, 09:41', status: 'Active' },
  { id: 'USR-002', name: 'Farah Operations', email: 'farah@malaysia-erp.com', role: 'Manager', lastActive: '20 Mar 2026, 08:12', status: 'Active' },
  { id: 'USR-003', name: 'Kelvin Logistics', email: 'kelvin@malaysia-erp.com', role: 'Staff', lastActive: '19 Mar 2026, 17:44', status: 'Active' },
  { id: 'USR-004', name: 'Mei Fong', email: 'meifong@malaysia-erp.com', role: 'Staff', lastActive: '18 Mar 2026, 14:20', status: 'Active' },
  { id: 'USR-005', name: 'Zack Fulfillment', email: 'zack@malaysia-erp.com', role: 'Staff', lastActive: '10 Mar 2026, 10:00', status: 'Inactive' },
];

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

export default function Users() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
          className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2"
          style={{ background: '#000080' }}
        >
          <UserPlus size={11} />
          Invite User
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Users table */}
        <div className="col-span-2">
          <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                  {['User', 'Email', 'Role', 'Last Active', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 font-normal text-[9px] tracking-[0.15em] uppercase"
                      style={{ color: '#6D8196' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors"
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
                      <button
                        onClick={() => setSelectedRole(user.role)}
                        className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase hover:opacity-80 transition-opacity"
                        style={{
                          color: roleStyle[user.role].color,
                          background: roleStyle[user.role].bg,
                        }}
                      >
                        {user.role}
                      </button>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[10px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                    >
                      {user.lastActive}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: user.status === 'Active' ? '#ADD8E6' : '#C8DFF0' }}
                        />
                        <span
                          className="text-[10px]"
                          style={{ color: user.status === 'Active' ? '#6D8196' : '#8AAFC8' }}
                        >
                          {user.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
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
