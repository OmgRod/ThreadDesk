"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Users, FileText, Trash2, Loader2, Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stats" | "users" | "orgs">("stats");
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const meData = await meRes.json();
      if (!meData.id || meData.id !== 1) {
        router.push("/");
        return;
      }
      setUser(meData);

      const [statsRes, usersRes, orgsRes] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/admin/organizations", { credentials: "include" }),
      ]);
      setStats(await statsRes.json());
      setUsers(await usersRes.json());
      setOrgs(await orgsRes.json());
      setLoading(false);
    }
    load();
  }, [router]);

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("User deleted");
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const deleteOrg = async (id: number) => {
    if (!confirm("Delete this organization?")) return;
    const res = await fetch(`/api/admin/organizations/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Organization deleted");
      setOrgs(orgs.filter((o) => o.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="font-bold">Admin Panel</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300">Dashboard</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["stats", "users", "orgs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === t
                  ? "bg-primary-600 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "stats" && stats && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <Users className="h-8 w-8 text-primary-600 mb-3" />
              <p className="text-3xl font-bold">{stats.users}</p>
              <p className="text-gray-500 text-sm">Total Users</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <Building2 className="h-8 w-8 text-primary-600 mb-3" />
              <p className="text-3xl font-bold">{stats.organizations}</p>
              <p className="text-gray-500 text-sm">Organizations</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <FileText className="h-8 w-8 text-primary-600 mb-3" />
              <p className="text-3xl font-bold">{stats.posts}</p>
              <p className="text-gray-500 text-sm">Total Posts</p>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-sm">{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "orgs" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orgs.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 text-sm">{o.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{o.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{o.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteOrg(o.id)}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}