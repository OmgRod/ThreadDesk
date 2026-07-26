"use client";

import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navItems = [
    { href: "/admin", label: "Stats" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/organizations", label: "Organizations" },
  ];

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!user?.isAdmin) return notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="w-64 border-r p-6 bg-muted/20 hidden md:block">
          <h2 className="text-lg font-bold mb-4">Admin Panel</h2>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md",
                  "hover:bg-primary/10 hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
