"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Trash2, Edit, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [page, setPage] = useState(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(""); // Input value
  const [activeSearch, setActiveSearch] = useState(""); // Actual query sent to API
  const [searchType, setSearchType] = useState<"id" | "email" | "name">("name");
  
  const router = useRouter();
  const debouncedTimeout = useRef<NodeJS.Timeout>();

  const loadUsers = useCallback(async (p: number, s: string, type: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${p}&search=${encodeURIComponent(s)}&searchType=${type}`, { credentials: "include" });
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  }, []);

  // Debouncing effect
  useEffect(() => {
    if (debouncedTimeout.current) clearTimeout(debouncedTimeout.current);
    
    debouncedTimeout.current = setTimeout(() => {
        setActiveSearch(searchQuery);
        setPage(1);
    }, 500);

    return () => clearTimeout(debouncedTimeout.current);
  }, [searchQuery]);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/");
    } else {
        loadUsers(page, activeSearch, searchType);
    }
  }, [user, authLoading, router, page, activeSearch, searchType, loadUsers]);

  const deleteUser = async (id: string) => {
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
        maxPostsPerMonth: u.maxPostsPerMonth || "",
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

  if (authLoading || (loading && users.length === 0)) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
            <select 
                className="p-2 border rounded-md text-sm"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "id" | "email" | "name")}
            >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="id">ID</option>
            </select>
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                    placeholder="Search users..." 
                    className="pl-8 p-2 border rounded-md" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>
      
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
                <td className="px-4 py-3 font-mono text-xs">{u.id}</td>
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
      <div className="flex justify-center gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4"/></Button>
        <span className="p-2">Page {page}</span>
        <Button variant="outline" onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4"/></Button>
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
          <div><label className="block text-sm font-medium">Max Posts</label><input type="number" className="w-full p-2 border rounded" value={formData.maxPostsPerMonth} onChange={e => setFormData({...formData, maxPostsPerMonth: parseInt(e.target.value)})} /></div>
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