"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Settings, User, CreditCard, Shield, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  useEffect(() => {
    fetch("/api/user/usage").then((r) => r.json()).then(setSettings).catch(console.error);
  }, []);

  const handleManageBilling = async () => {
    setIsLoadingBilling(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast({ title: "No billing account", description: "Upgrade to Pro first" });
    } catch {
      toast({ title: "Error", description: "Failed to open billing portal", variant: "destructive" });
    } finally {
      setIsLoadingBilling(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account</p>
        </div>
      </div>

      <SettingsCard icon={User} title="Profile" description="Your account information">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://accounts.clerk.dev/user" target="_blank" rel="noopener noreferrer">
              Manage<ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard icon={CreditCard} title="Subscription" description="Manage your plan">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Plan</span>
              <Badge variant={settings?.tier === "free" ? "secondary" : "default"}>{settings?.tier || "Free"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings?.buildsUsed || 0} of {settings?.monthlyLimit === -1 ? "unlimited" : settings?.monthlyLimit || 5} builds
            </p>
          </div>
          <div className="flex gap-2">
            {settings?.tier === "free" && <Link href="/pricing"><Button size="sm">Upgrade</Button></Link>}
            {settings?.tier !== "free" && (
              <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={isLoadingBilling}>
                {isLoadingBilling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Billing"}
              </Button>
            )}
          </div>
        </div>
        {settings?.features && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-sm font-medium mb-2">Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {settings.features.map((f, i) => <li key={i}>• {f}</li>)}
              </ul>
            </div>
          </>
        )}
      </SettingsCard>

      <SettingsCard icon={Shield} title="Security" description="Protect your account">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Password & 2FA</p>
            <p className="text-sm text-muted-foreground">Manage authentication settings</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://accounts.clerk.dev/user/security" target="_blank" rel="noopener noreferrer">
              Manage<ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2"><Icon className="h-5 w-5" /><CardTitle>{title}</CardTitle></div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
