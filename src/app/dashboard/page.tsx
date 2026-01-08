"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, UserButton, useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  BarChart3,
  CreditCard,
  History,
  Settings,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BuildForm } from "@/components/build-form";
import { BuildOutput } from "@/components/build-output";
import { toast } from "@/hooks/use-toast";
import type { BuildResponse, SubscriptionTier } from "@/types";

interface UsageData {
  tier: SubscriptionTier;
  buildsUsed: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: string;
  features: string[];
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [buildResult, setBuildResult] = useState<BuildResponse | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  // Check for success param from Stripe checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Subscription activated!",
        description: "Thank you for upgrading. Enjoy your new features!",
        variant: "default",
      });
    }
  }, [searchParams]);

  // Fetch usage data
  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch("/api/user/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setIsLoadingUsage(false);
      }
    }

    if (isSignedIn) {
      fetchUsage();
    }
  }, [isSignedIn]);

  const handleBuildComplete = (response: BuildResponse) => {
    setBuildResult(response);
    // Refresh usage data
    fetch("/api/user/usage")
      .then((res) => res.json())
      .then((data) => setUsage(data))
      .catch(() => {});
  };

  const handleNewBuild = () => {
    setBuildResult(null);
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
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
            <CardDescription>
              Please sign in to access your dashboard.
            </CardDescription>
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
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 hidden md:block">
        <div className="p-4">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">BuildPrompt AI</span>
          </Link>

          <nav className="space-y-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/history">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <History className="h-4 w-4" />
                Build History
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleManageBilling}
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </Button>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </nav>
        </div>

        {/* Usage Card in Sidebar */}
        {usage && (
          <div className="p-4 mt-auto">
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
                  builds remaining this month
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
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top Bar */}
        <header className="border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Welcome, {user?.firstName || "Builder"}!
          </h1>
          <UserButton afterSignOutUrl="/" />
        </header>

        <div className="p-6">
          {buildResult ? (
            <BuildOutput build={buildResult} onNewBuild={handleNewBuild} />
          ) : (
            <div className="space-y-6">
              {/* Quick Stats */}
              {usage && !isLoadingUsage && (
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Builds This Month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {usage.buildsUsed}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        of {usage.monthlyLimit === -1 ? "unlimited" : usage.monthlyLimit}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Current Plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-3xl font-bold capitalize">
                          {usage.tier}
                        </div>
                        {usage.tier !== "free" && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Resets On</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {new Date(usage.resetDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Build Form */}
              <div className="max-w-2xl mx-auto">
                <BuildForm
                  onBuildComplete={handleBuildComplete}
                  remainingBuilds={usage?.remaining}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
