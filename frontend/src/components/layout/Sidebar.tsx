"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, Settings, Users, Zap, UserCog, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Overview" },
  { href: "/dashboard/posts", icon: List, label: "Posts" },
  { href: "/dashboard/members", icon: Users, label: "Members" },
  { href: "/dashboard/automation", icon: Zap, label: "Automation" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/settings", icon: Settings, label: "Org Settings" },
  { href: "/dashboard/account", icon: UserCog, label: "Account" },
];

export function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen?: boolean, setMobileMenuOpen?: (v: boolean) => void }) {
  const pathname = usePathname();

  const SidebarContent = (
    <div className="space-y-4 py-4 w-64">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Dashboard
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <div className={cn("fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-all md:hidden", mobileMenuOpen ? "block" : "hidden")} onClick={() => setMobileMenuOpen && setMobileMenuOpen(false)} />
      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 h-screen border-r bg-background transition-transform md:hidden pt-14",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {SidebarContent}
      </nav>

      {/* Desktop Sidebar */}
      <nav className="w-64 border-r bg-muted/20 h-[calc(100vh-3.5rem)] hidden md:block sticky top-14">
        {SidebarContent}
      </nav>
    </>
  );
}
