"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users, Building2, FileText, MessageSquare } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function AdminStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
    async function loadStats() {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (res.ok) {
        setStats(await res.json());
      }
      setLoading(false);
    }
    loadStats();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Platform Statistics</h1>
      {stats && (
        <>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <Users className="h-8 w-8 text-primary mb-3" />
              <p className="text-3xl font-bold">{stats.users}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <Building2 className="h-8 w-8 text-primary mb-3" />
              <p className="text-3xl font-bold">{stats.organizations}</p>
              <p className="text-sm text-muted-foreground">Organizations</p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <p className="text-3xl font-bold">{stats.posts}</p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
              <MessageSquare className="h-8 w-8 text-primary mb-3" />
              <p className="text-3xl font-bold">{stats.messages}</p>
              <p className="text-sm text-muted-foreground">Total Messages</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-card rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4">User Growth (Last 7 Days)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.userTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                      <YAxis allowDecimals={false} className="text-xs text-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
            <div className="p-6 bg-card rounded-xl border shadow-sm">
                <h3 className="font-semibold mb-4">Message Volume (Last 7 Days)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.messageTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                      <YAxis allowDecimals={false} className="text-xs text-muted-foreground" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
