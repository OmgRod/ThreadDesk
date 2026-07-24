"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Building2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { OrgCard } from "@/components/orgs/OrgCard";

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/orgs", { credentials: "include" });
        if (res.ok) {
          setOrgs(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">Discover and follow organizations.</p>
        </div>

        {orgs.length === 0 ? (
          <div className="text-center py-16 bg-background border rounded-2xl text-muted-foreground">
            <Users className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-semibold">No organizations found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
