"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex flex-1 relative">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-muted/10 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
