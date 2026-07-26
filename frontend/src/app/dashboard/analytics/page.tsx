"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

type Org = {
  id: number;
  name: string;
};

type DailyView = {
  date: string;
  count: number;
};

type Analytics = {
  dailyViews: DailyView[];
  totalViews: number;
  uniqueViews: number;
  totalComments: number;
  totalReactions: number;
  totalFollowers: number;
};

export default function AnalyticsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orgs/user/mine", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setOrgs(data);
        if (data.length > 0) setSelectedOrgId(data[0].id);
        else setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedOrgId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/org/${selectedOrgId}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch analytics");
        }
        return res.json();
      })
      .then(setAnalytics)
      .catch((err) => {
        setError(err.message);
        toast.error(err.message);
      })
      .finally(() => setLoading(false));
  }, [selectedOrgId]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const filledDailyViews = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const found = analytics?.dailyViews.find(v => v.date === dateStr);
    return { date: dateStr.slice(5), count: found ? found.count : 0 };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {orgs.length === 0 ? (
        <p>No organizations found.</p>
      ) : (
        <>
          <select 
            value={selectedOrgId || ""}
            onChange={(e) => setSelectedOrgId(parseInt(e.target.value))}
            className="p-2 border rounded-md"
          >
            {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>

          {error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          ) : analytics && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-card rounded-lg border shadow-sm">
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{analytics.totalViews}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border shadow-sm">
                  <p className="text-sm text-muted-foreground">Unique Views</p>
                  <p className="text-2xl font-bold">{analytics.uniqueViews}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border shadow-sm">
                  <p className="text-sm text-muted-foreground">Comments</p>
                  <p className="text-2xl font-bold">{analytics.totalComments}</p>
                </div>
                <div className="p-4 bg-card rounded-lg border shadow-sm">
                  <p className="text-sm text-muted-foreground">Reactions</p>
                  <p className="text-2xl font-bold">{analytics.totalReactions}</p>
                </div>
              </div>

              <div className="p-6 bg-card rounded-lg border shadow-sm">
                <h3 className="font-semibold mb-4">Views Trend (Last 7 Days)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filledDailyViews}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                      <YAxis allowDecimals={false} className="text-xs text-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
