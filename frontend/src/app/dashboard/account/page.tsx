"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  User, Shield, Trash2, AlertTriangle, Loader2,
  KeyRound, Eye, EyeOff, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();

  // Change name
  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar: user?.avatar, isPublic: true }),
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Name updated successfully!");
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to update name");
    }
    setSavingName(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to change password");
    }
    setSavingPassword(false);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    setDeleting(true);
    const res = await fetch("/api/users/me", {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Your account has been deleted.");
      await logout();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account credentials and preferences.</p>
      </div>

      {/* --- Change Name --- */}
      <section className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Display Name</h2>
            <p className="text-sm text-muted-foreground">Update the name shown on your profile.</p>
          </div>
        </div>
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:outline-none"
              required
              minLength={2}
            />
          </div>
          <button
            type="submit"
            disabled={savingName || name === user?.name}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingName ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            Save Name
          </button>
        </form>
      </section>

      {/* --- Change Password --- */}
      <section className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Change Password</h2>
            <p className="text-sm text-muted-foreground">Ensure your account uses a secure password.</p>
          </div>
        </div>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:outline-none"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-muted-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:outline-none"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-muted-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:outline-none"
                required
              />
              {newPassword && confirmPassword && (
                <span className="absolute right-3 top-2.5">
                  {newPassword === confirmPassword
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <AlertTriangle className="h-4 w-4 text-red-500" />
                  }
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
            Change Password
          </button>
        </form>
      </section>

      {/* --- Security Info --- */}
      <section className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Account Info</h2>
            <p className="text-sm text-muted-foreground">Details about your ThreadDesk account.</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Email address</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono text-muted-foreground">#{user?.id}</span>
          </div>
        </div>
      </section>

      {/* --- Danger Zone --- */}
      <section className="bg-card rounded-xl border border-red-200 dark:border-red-900/50 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">Permanent and irreversible actions.</p>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            Deleting your account is permanent. All your data including posts, comments, messages and organization memberships will be permanently removed.
          </p>
        </div>
        {!showDeleteModal ? (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Delete My Account
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium">Type <code className="bg-muted px-1.5 py-0.5 rounded text-red-600 font-mono">DELETE</code> to confirm:</p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-red-300 dark:border-red-800 rounded-lg bg-background focus:ring-2 focus:ring-red-400 focus:outline-none font-mono"
            />
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={deleting || deleteConfirm !== "DELETE"}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                Permanently Delete Account
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
