'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Shield,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { UserAccount, UserRole } from '@/types/api';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';

const ROLE_DEFINITIONS: Record<
  UserRole,
  { label: string; description: string; badgeColor: string; textColor: string }
> = {
  SUPERADMIN: {
    label: 'Superadmin',
    description: 'Full station control, user delegation, and database administration',
    badgeColor: 'bg-purple-100 border-purple-300',
    textColor: 'text-purple-800',
  },
  FIELD_ENGINEER: {
    label: 'Field Engineer',
    description: 'Irrigation schedule planning, pump threshold tuning, telemetry control',
    badgeColor: 'bg-emerald-100 border-emerald-300',
    textColor: 'text-emerald-800',
  },
  AGRONOMIST: {
    label: 'Agronomist',
    description: 'Crop water analytics, NASA solar insolation, quantum benchmarking',
    badgeColor: 'bg-blue-100 border-blue-300',
    textColor: 'text-blue-800',
  },
  FARMER: {
    label: 'Farmer',
    description: 'Farm overview, water demand verification, operational schedule viewer',
    badgeColor: 'bg-amber-100 border-amber-300',
    textColor: 'text-amber-800',
  },
  PENDING: {
    label: 'Pending Assignment',
    description: 'Awaiting Superadmin authorization and operational role assignment',
    badgeColor: 'bg-orange-100 border-orange-300',
    textColor: 'text-orange-800',
  },
};

export default function UsersManagementPage() {
  const { user: currentUser, isSuperadmin } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // New user modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('FIELD_ENGINEER');
  const [newLocation, setNewLocation] = useState('Primary Farm Station');
  const [creating, setCreating] = useState(false);

  // User deletion state
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiService.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to fetch users from database.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, role: UserRole) => {
    setUpdatingId(userId);
    setFeedback(null);
    try {
      const res = await apiService.updateUserRole(userId, role);
      setFeedback({
        message: res.message || `Successfully assigned ${role} role.`,
        type: 'success',
      });
      // update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role, status: role === 'PENDING' ? 'PENDING' : 'ACTIVE' } : u))
      );
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to update user role.',
        type: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    setFeedback(null);
    try {
      const res = await apiService.deleteUser(userToDelete.id);
      setFeedback({
        message: res.message || `User account '${userToDelete.username}' has been deleted.`,
        type: 'success',
      });
      // Remove from state immediately
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to delete user account.',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;

    setCreating(true);
    setFeedback(null);
    try {
      const registered = await apiService.register({
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        full_name: newName.trim(),
        location: newLocation.trim(),
      });

      if (newRole !== 'PENDING') {
        await apiService.updateUserRole(registered.user.id, newRole);
      }

      setFeedback({
        message: `Successfully created user '${newName || newEmail}' with role ${newRole}.`,
        type: 'success',
      });

      setIsModalOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setNewRole('FIELD_ENGINEER');
      await loadUsers();
    } catch (err: any) {
      setFeedback({
        message: err.message || 'Failed to enroll user.',
        type: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    const matchesSearch =
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.location?.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingCount = users.filter((u) => u.role === 'PENDING').length;
  const engineerCount = users.filter((u) => u.role === 'FIELD_ENGINEER').length;
  const adminCount = users.filter((u) => u.role === 'SUPERADMIN').length;
  const farmerCount = users.filter((u) => u.role === 'FARMER').length;

  return (
    <div className="space-y-6">
      <AppHeader
        title="Role & Operator Management"
        subtitle="Superadmin console: Inspect registered field operators and assign operational access roles."
      />

      {/* Top Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E6E4DC] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Accounts
            </span>
            <Users className="w-4 h-4 text-[#0E3A27]" />
          </div>
          <div className="text-2xl font-black text-[#111827]">{users.length}</div>
          <p className="text-[11px] text-[#6B7280]">Saved in Neon PostgreSQL DB</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-orange-200 bg-orange-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-orange-700">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pending Assignment
            </span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-900">{pendingCount}</div>
          <p className="text-[11px] text-orange-700">
            {pendingCount === 0 ? 'All users assigned' : 'Requires Superadmin action'}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E6E4DC] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Field Engineers
            </span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#111827]">{engineerCount}</div>
          <p className="text-[11px] text-[#6B7280]">Station operators authorized</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E6E4DC] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Superadmins
            </span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#111827]">{adminCount}</div>
          <p className="text-[11px] text-[#6B7280]">System administrators</p>
        </div>
      </div>

      {/* Action Bar (Search, Filter, Enroll Button) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E6E4DC] shadow-xs">
        <div className="flex-1 w-full sm:w-auto flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by operator name, email, or location..."
              className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3.5 py-2 pl-9 text-xs text-[#111827] focus:outline-none focus:border-emerald-600"
            />
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs text-[#374151] focus:outline-none focus:border-emerald-600"
          >
            <option value="ALL">All Roles</option>
            <option value="PENDING">Pending Only</option>
            <option value="FIELD_ENGINEER">Field Engineers</option>
            <option value="AGRONOMIST">Agronomists</option>
            <option value="FARMER">Farmers</option>
            <option value="SUPERADMIN">Superadmins</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={loadUsers}
            className="p-2 text-[#4B5563] hover:text-[#111827] hover:bg-[#FAF9F5] rounded-xl border border-[#E6E4DC] transition-all cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 bg-[#0E3A27] hover:bg-[#072418] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Enroll User
          </button>
        </div>
      </div>

      {/* Users & Roles Table */}
      <div className="bg-white rounded-2xl border border-[#E6E4DC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E6E4DC] text-[#4B5563] uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-5 font-semibold">User / Operator</th>
                <th className="p-3.5 font-semibold">Contact & Location</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold">Current Role</th>
                <th className="p-3.5 font-semibold">Assign Role</th>
                <th className="p-3.5 pr-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE3]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B7280]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading registered operators from database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#6B7280]">
                    No operators found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.PENDING;
                  const isCurrentSuper = u.username === 'superadmin';

                  return (
                    <tr key={u.id} className="hover:bg-[#FCFBF8] transition-colors">
                      {/* Name & Avatar */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#092619] text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-400/30 shrink-0">
                            {(u.full_name || u.username).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#111827] flex items-center gap-1.5">
                              {u.full_name || u.username}
                              {u.is_superuser && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#6B7280] font-mono">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td className="p-3.5 text-[#374151]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="w-3 h-3 text-[#9CA3AF]" />
                            <span>{u.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                            <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                            <span>{u.location || 'Primary Farm Station'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {u.role === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-200">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Authorized
                          </span>
                        )}
                      </td>

                      {/* Current Role Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleDef.badgeColor} ${roleDef.textColor}`}
                        >
                          {roleDef.label}
                        </span>
                      </td>

                      {/* Role Assignment Action */}
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          disabled={updatingId === u.id || isCurrentSuper}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as UserRole)
                          }
                          className="bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] focus:outline-none focus:border-emerald-600 disabled:opacity-50 cursor-pointer"
                        >
                          <option value="FIELD_ENGINEER">Field Engineer (Operator)</option>
                          <option value="AGRONOMIST">Agronomist (Analyst)</option>
                          <option value="FARMER">Farmer (Viewer)</option>
                          <option value="SUPERADMIN">Superadmin</option>
                          <option value="PENDING">Pending Review</option>
                        </select>
                      </td>

                      {/* Delete User Action */}
                      <td className="p-3.5 pr-5 text-right">
                        {isCurrentSuper || u.id === currentUser?.id ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 select-none px-2 py-1 rounded-lg bg-[#FAF9F5] border border-[#E6E4DC]"
                            title="Protected Superadmin account"
                          >
                            <Shield className="w-3 h-3 text-purple-500" />
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-2xs group"
                            title={`Delete account for ${u.username}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700 transition-colors" />
                            <span>Delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E6E4DC] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EFECE3] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Enroll New Station Operator
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Directly provision an operator account and assign their operational role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Priyabrata Mohanty"
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. priyabrata@qirrigate.farm"
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Set account password"
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Operational Role Assignment
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                >
                  <option value="FIELD_ENGINEER">Field Engineer / Operator (Active)</option>
                  <option value="AGRONOMIST">Agronomist / Solar Analyst (Active)</option>
                  <option value="FARMER">Farmer / Site Viewer (Active)</option>
                  <option value="SUPERADMIN">Superadmin (Full Access)</option>
                  <option value="PENDING">Pending Review (Awaiting Later Assignment)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">
                  Field Location
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EFECE3]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] bg-[#FAF9F5] border border-[#E6E4DC] hover:bg-[#F0EFEA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0E3A27] hover:bg-[#072418] shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {creating ? 'Saving...' : 'Enroll & Assign Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#E6E4DC] max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#111827]">
                  Delete Operator Account?
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[#111827] font-semibold">
                    {userToDelete.full_name || userToDelete.username}
                  </strong>{' '}
                  (<span className="font-mono text-emerald-800">@{userToDelete.username}</span>)?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#EFECE3] text-xs space-y-1.5 text-[#4B5563]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Email:</span>
                <span className="font-mono font-medium text-[#111827]">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Current Role:</span>
                <span className="font-semibold text-[#111827]">{userToDelete.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Location:</span>
                <span>{userToDelete.location || 'Primary Farm Station'}</span>
              </div>
            </div>

            <p className="text-[11px] text-rose-600 bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/60 leading-normal">
              ⚠️ Warning: This will revoke access immediately, remove their database credentials, and invalidate any open sessions. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EFECE3]">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] bg-[#FAF9F5] hover:bg-[#F0EFEA] border border-[#E6E4DC] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={confirmDeleteUser}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {deletingId !== null ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
