"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  Sparkles,
  Settings,
  User,
  CreditCard,
  Bell,
  Shield,
  Loader2,
  ExternalLink,
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
import { toast } from "@/hooks/use-toast";
import type { SubscriptionTier } from "@/types";

interface UserSettings {
  tier: SubscriptionTier;
  buildsUsed: number;
  monthlyLimit: number;
  features: string[];
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/user/usage");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    }

    if (isSignedIn) {
      fetchSettings();
    }
  }, [isSignedIn]);

  const handleManageBilling = async () => {
    setIsLoadingBilling(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "No billing account",
          description: "Upgrade to Pro to access billing management",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBilling(false);
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
              Please sign in to access settings.
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">BuildPrompt AI</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Settings</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://accounts.clerk.dev/user"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manage
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Subscription</CardTitle>
              </div>
              <CardDescription>
                Manage your plan and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Current Plan</p>
                    <Badge
                      variant={
                        settings?.tier === "free" ? "secondary" : "default"
                      }
                    >
                      {settings?.tier || "Free"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {settings?.buildsUsed || 0} of{" "}
                    {settings?.monthlyLimit === -1
                      ? "unlimited"
                      : settings?.monthlyLimit || 5}{" "}
                    builds used this month
                  </p>
                </div>
                <div className="flex gap-2">
                  {settings?.tier === "free" && (
                    <Link href="/pricing">
                      <Button size="sm">Upgrade</Button>
                    </Link>
                  )}
                  {settings?.tier !== "free" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManageBilling}
                      disabled={isLoadingBilling}
                    >
                      {isLoadingBilling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Manage Billing"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {settings?.features && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Plan Features:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {settings.features.map((feature, i) => (
                        <li key={i}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Configure how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Notification preferences are managed through your account
                settings.
              </p>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>
                Protect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password & Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your password and 2FA settings
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://accounts.clerk.dev/user/security"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manage
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    toast({
                      title: "Contact Support",
                      description:
                        "Please contact support@buildprompt.ai to delete your account",
                    })
                  }
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
