"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function AdminOrganizationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrg, setEditingOrg] = useState<any | null>(null);
  
  // Edit states
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
    async function loadOrgs() {
      const res = await fetch("/api/admin/organizations", { credentials: "include" });
      if (res.ok) {
        setOrgs(await res.json());
      }
      setLoading(false);
    }
    loadOrgs();
  }, [user, authLoading, router]);

  const deleteOrg = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/admin/organizations/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      toast.success("Organization deleted");
      setOrgs(orgs.filter(o => o.id !== id));
    } else {
      toast.error("Failed to delete organization");
    }
  };

  const startEdit = (o: any) => {
    setEditingOrg(o);
    setFormData({ 
        name: o.name, 
        description: o.description || "", 
        website: o.website || "", 
        verified: !!o.verified 
    });
  };

  const saveOrg = async () => {
    if (!editingOrg) return;
    const res = await fetch(`/api/admin/organizations/${editingOrg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Organization updated");
      setOrgs(orgs.map(o => o.id === editingOrg.id ? { ...o, ...formData } : o));
      setEditingOrg(null);
    } else {
      toast.error("Failed to update organization");
    }
  };

  if (loading || authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Organization Management</h1>
      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Verified</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orgs.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">{o.id}</td>
                <td className="px-4 py-3">{o.name}</td>
                <td className="px-4 py-3">{o.verified ? "✅" : "❌"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(o)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteOrg(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editingOrg} onClose={() => setEditingOrg(null)} title="Edit Organization">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium">Name</label><input className="w-full p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
          <div><label className="block text-sm font-medium">Description</label><textarea className="w-full p-2 border rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div><label className="block text-sm font-medium">Website</label><input className="w-full p-2 border rounded" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.verified} onChange={e => setFormData({...formData, verified: e.target.checked})} />
            <label className="text-sm font-medium">Verified</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingOrg(null)}>Cancel</Button>
            <Button onClick={saveOrg}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
