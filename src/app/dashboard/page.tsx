"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [buildResult, setBuildResult] = useState<BuildResponse | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Subscription activated!", description: "Enjoy your new features!" });
    }
  }, [searchParams]);

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/usage")
        .then((res) => res.json())
        .then(setUsage)
        .catch(console.error);
    }
  }, [isSignedIn]);

  const handleBuildComplete = (response: BuildResponse) => {
    setBuildResult(response);
    fetch("/api/user/usage").then((res) => res.json()).then(setUsage).catch(() => {});
  };

  if (buildResult) {
    return <BuildOutput build={buildResult} onNewBuild={() => setBuildResult(null)} />;
  }

  return (
    <div className="space-y-6">
      {usage && (
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard label="Builds This Month" value={usage.buildsUsed}
            sub={`of ${usage.monthlyLimit === -1 ? "unlimited" : usage.monthlyLimit}`} />
          <StatCard label="Current Plan" value={usage.tier} capitalize
            icon={usage.tier !== "free" && <CheckCircle className="h-5 w-5 text-green-500" />} />
          <StatCard label="Resets On"
            value={new Date(usage.resetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
        </div>
      )}
      <Separator />
      <div className="max-w-2xl mx-auto">
        <BuildForm onBuildComplete={handleBuildComplete} remainingBuilds={usage?.remaining} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, capitalize, icon }: {
  label: string; value: string | number; sub?: string; capitalize?: boolean; icon?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardDescription>{label}</CardDescription></CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className={`text-3xl font-bold ${capitalize ? "capitalize" : ""}`}>{value}</div>
          {icon}
        </div>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
