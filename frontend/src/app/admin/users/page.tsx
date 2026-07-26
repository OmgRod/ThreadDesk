"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  // Edit states
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
    async function loadUsers() {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) {
        setUsers(await res.json());
      }
      setLoading(false);
    }
    loadUsers();
  }, [user, authLoading, router]);

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toast.success("User deleted");
      setUsers(users.filter(u => u.id !== id));
    } else {
      toast.error("Failed to delete user");
    }
  };

  const startEdit = (u: any) => {
    setEditingUser(u);
    setFormData({ 
        name: u.name, 
        email: u.email, 
        isAdmin: !!u.isAdmin,
        plan: u.plan || "free",
        maxOrganizations: u.maxOrganizations || "",
        maxMessagesPerMonth: u.maxMessagesPerMonth || "",
        hasAnalytics: !!u.hasAnalytics,
        allowTeamMembers: !!u.allowTeamMembers
    });
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include",
    });
    if (res.ok) {
      toast.success("User updated");
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      setEditingUser(null);
    } else {
      toast.error("Failed to update user");
    }
  };

  if (loading || authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(u)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User & Plan">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium">Name</label><input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium">Email</label><input className="w-full p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
          <div>
            <label className="block text-sm font-medium">Plan</label>
            <select className="w-full p-2 border rounded" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value})}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium">Max Orgs</label><input type="number" className="w-full p-2 border rounded" value={formData.maxOrganizations} onChange={e => setFormData({...formData, maxOrganizations: parseInt(e.target.value)})} /></div>
          <div><label className="block text-sm font-medium">Max Messages</label><input type="number" className="w-full p-2 border rounded" value={formData.maxMessagesPerMonth} onChange={e => setFormData({...formData, maxMessagesPerMonth: parseInt(e.target.value)})} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.isAdmin} onChange={e => setFormData({...formData, isAdmin: e.target.checked})} />
            <label className="text-sm font-medium">Is Admin</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.hasAnalytics} onChange={e => setFormData({...formData, hasAnalytics: e.target.checked})} />
            <label className="text-sm font-medium">Has Analytics</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.allowTeamMembers} onChange={e => setFormData({...formData, allowTeamMembers: e.target.checked})} />
            <label className="text-sm font-medium">Allow Team Members</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={saveUser}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
