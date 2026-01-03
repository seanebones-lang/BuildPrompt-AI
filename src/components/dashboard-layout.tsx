"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton, useAuth } from "@clerk/nextjs";
import {
  Sparkles,
  BarChart3,
  CreditCard,
  History,
  Settings,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { SubscriptionTier } from "@/types";

interface UsageData {
  tier: SubscriptionTier;
  remaining: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/dashboard/history", icon: History, label: "Build History" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/user/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage({ tier: data.tier, remaining: data.remaining });
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      }
    }

    if (isSignedIn) {
      fetchUsage();
    }
  }, [isSignedIn]);

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/sign-in">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 border-r bg-background transform transition-transform duration-200 ease-in-out md:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">BuildPrompt AI</span>
              </Link>
              <button
                className="md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleManageBilling}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </Button>
          </nav>

          {/* Usage Card */}
          {usage && (
            <div className="p-4 border-t">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Usage</CardTitle>
                    <Badge
                      variant={usage.tier === "free" ? "secondary" : "default"}
                    >
                      {usage.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="text-2xl font-bold">
                    {usage.remaining === -1 ? "Unlimited" : usage.remaining}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    builds remaining
                  </p>
                  {usage.tier === "free" && (
                    <Link href="/pricing">
                      <Button size="sm" className="w-full mt-3">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold">
              Welcome, {user?.firstName || "Builder"}!
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
