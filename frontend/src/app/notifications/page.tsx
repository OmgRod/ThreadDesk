"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Bell, Check, CheckCheck, UserPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth"); return; }
    loadNotifications();
  }, [user, authLoading]);

  async function loadNotifications() {
    const res = await fetch("/api/notifications", { credentials: "include" });
    if (res.ok) setNotifications(await res.json());
    setLoading(false);
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "PUT", credentials: "include" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "PUT", credentials: "include" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  async function acceptInvite(notification: any) {
    // Extract invite ID from the link e.g. /invites/123
    const inviteId = notification.link?.split("/invites/")[1];
    if (!inviteId) return;

    const res = await fetch(`/api/orgs/invites/${inviteId}/accept`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      toast.success("You've joined the organization!");
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, read: true, actionDone: "accepted" } : n)
      );
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to accept invite");
    }
  }

  async function declineInvite(notification: any) {
    const inviteId = notification.link?.split("/invites/")[1];
    if (!inviteId) return;

    const res = await fetch(`/api/orgs/invites/${inviteId}/decline`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      toast.success("Invite declined.");
      markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notification.id ? { ...n, read: true, actionDone: "declined" } : n)
      );
    } else {
      toast.error("Failed to decline invite");
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading || authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-background rounded-xl border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-30" />
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const isInvite = notification.type === "org_invite";
              const alreadyActioned = notification.actionDone;

              return (
                <div
                  key={notification.id}
                  className={`p-4 sm:p-5 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isInvite ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground"}`}>
                      {isInvite ? <UserPlus className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? "" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markRead(notification.id)}
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.createdAt)}</p>

                      {/* Invite action buttons */}
                      {isInvite && !alreadyActioned && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => acceptInvite(notification)}
                            className="px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineInvite(notification)}
                            className="px-4 py-1.5 border text-sm rounded-lg hover:bg-muted transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {isInvite && alreadyActioned && (
                        <p className="mt-2 text-sm text-muted-foreground capitalize italic">
                          Invite {alreadyActioned}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
