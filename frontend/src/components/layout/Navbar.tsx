"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Building2, LogOut, User as UserIcon, Menu, Bell, MessageSquare, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import { fixUploadUrl } from "@/lib/utils";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    async function fetchUnread() {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {onMenuClick && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">ThreadDesk</span>
          </Link>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          {!loading && user && (
            <>
              {/* Dynamic Action Buttons based on path */}
              {pathname !== "/dashboard" && (
                <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => window.location.href = "/dashboard"}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              )}
              
              <Button variant="ghost" size="icon" onClick={() => window.location.href = "/messages"}>
                <MessageSquare className="h-5 w-5" />
              </Button>
              
              <Link href="/notifications" className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}

          <ModeToggle />

          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" className="relative h-9 w-9 rounded-full p-0 border-primary/20">
                    {user.avatar ? (
                      <img src={fixUploadUrl(user.avatar)} alt="avatar" className="rounded-full h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = "/profile"}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => window.location.href = "/auth"}>
                  Log in
                </Button>
                <Button size="sm" onClick={() => window.location.href = "/auth?mode=signup"}>
                  Sign up
                </Button>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
