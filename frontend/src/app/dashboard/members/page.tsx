"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Users, Loader2, UserPlus, Trash2, Shield, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    async function loadOrgs() {
      const res = await fetch("/api/orgs/user/mine", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
        if (data.length > 0) setSelectedOrgId(data[0].id.toString());
      }
      setLoading(false);
    }
    loadOrgs();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!selectedOrgId) return;
    fetchMembersAndInvites();
  }, [selectedOrgId, fetchMembersAndInvites]);

  async function fetchMembersAndInvites() {
    const [membersRes, invitesRes] = await Promise.all([
      fetch(`/api/orgs/${selectedOrgId}/members`, { credentials: "include" }),
      fetch(`/api/orgs/${selectedOrgId}/invites`, { credentials: "include" }),
    ]);
    if (membersRes.ok) setMembers(await membersRes.json());
    if (invitesRes.ok) setInvites(await invitesRes.json());
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    const res = await fetch(`/api/orgs/${selectedOrgId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      credentials: "include",
    });

    if (res.ok) {
      toast.success(`Invite sent to ${inviteEmail}!`);
      setShowAddMember(false);
      setInviteEmail("");
      fetchMembersAndInvites();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to send invite");
    }
    setInviting(false);
  }

  async function removeMember() {
    if (memberToRemove === null) return;
    const res = await fetch(`/api/orgs/${selectedOrgId}/members/${memberToRemove}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Member removed.");
      setMembers(members.filter((m) => m.id !== memberToRemove));
      setMemberToRemove(null);
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to remove member");
      setMemberToRemove(null);
    }
  }

  async function revokeInvite(inviteId: number) {
    const res = await fetch(`/api/orgs/${selectedOrgId}/invites/${inviteId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Invite revoked.");
      setInvites(invites.filter((i) => i.id !== inviteId));
    }
  }

  if (loading || authLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const selectedOrg = orgs.find((o) => o.id.toString() === selectedOrgId);
  const canManage = selectedOrg?.role === "owner" || selectedOrg?.role === "admin";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Modal isOpen={memberToRemove !== null} onClose={() => setMemberToRemove(null)} title="Remove Member">
        <p className="text-muted-foreground mb-4">Are you sure you want to remove this member?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setMemberToRemove(null)}>Cancel</Button>
          <Button variant="destructive" onClick={removeMember}>Remove</Button>
        </div>
      </Modal>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Members</h1>
        {orgs.length > 0 && (
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background text-sm font-medium w-full sm:w-64"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name} ({org.role})</option>
            ))}
          </select>
        )}
      </div>

      {orgs.length === 0 ? (
        <div className="text-center py-12 bg-background border rounded-xl text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>You don&apos;t belong to any organizations yet.</p>
        </div>
      ) : (
        <>
          {/* Current Members */}
          <div className="bg-background rounded-xl border overflow-hidden">
            <div className="p-4 sm:p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Members <span className="text-sm text-muted-foreground font-normal">({members.length})</span>
              </h2>
              {canManage && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 font-medium transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite by Email
                </button>
              )}
            </div>

            {showAddMember && canManage && (
              <div className="p-4 sm:p-6 border-b bg-muted/20">
                <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-background text-sm sm:w-36"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
                  </button>
                </form>
              </div>
            )}

            <div className="divide-y">
              {members.map((member) => (
                <div key={member.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {member.avatar ? (
                      <img src={member.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      member.role === "owner" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                      member.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      member.role === "editor" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>{member.role}</span>
                    {canManage && member.role !== "owner" && (user ? member.userId !== user.id : true) && (
                      <button onClick={() => setMemberToRemove(member.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invites */}
          {canManage && invites.length > 0 && (
            <div className="bg-background rounded-xl border overflow-hidden">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-amber-500" />
                  Pending Invites <span className="text-sm text-muted-foreground font-normal">({invites.length})</span>
                </h2>
              </div>
              <div className="divide-y">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invite.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">Invited as {invite.role}</p>
                      </div>
                    </div>
                    <button onClick={() => revokeInvite(invite.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors" title="Revoke invite">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
