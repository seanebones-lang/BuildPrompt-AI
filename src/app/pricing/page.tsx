"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Sparkles, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/types";

const PRICE_IDS: Record<string, string> = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro",
  enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
};

export default function PricingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<SubscriptionTier | null>(null);

  // Check for canceled checkout
  if (searchParams.get("canceled") === "true") {
    toast({
      title: "Checkout canceled",
      description: "No worries! You can upgrade anytime.",
    });
  }

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (tier === "free") return;

    setIsLoading(tier);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: PRICE_IDS[tier],
          tier,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">BuildPrompt AI</span>
          </Link>
          <nav>
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button>Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Pricing Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <PricingCard
            tier="free"
            info={SUBSCRIPTION_TIERS.free}
            isLoading={isLoading === "free"}
            onSubscribe={() => handleSubscribe("free")}
            isSignedIn={isSignedIn}
          />

          {/* Pro Tier */}
          <PricingCard
            tier="pro"
            info={SUBSCRIPTION_TIERS.pro}
            isLoading={isLoading === "pro"}
            onSubscribe={() => handleSubscribe("pro")}
            isSignedIn={isSignedIn}
            isPopular
          />

          {/* Enterprise Tier */}
          <PricingCard
            tier="enterprise"
            info={SUBSCRIPTION_TIERS.enterprise}
            isLoading={isLoading === "enterprise"}
            onSubscribe={() => handleSubscribe("enterprise")}
            isSignedIn={isSignedIn}
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQItem
              question="What counts as a build?"
              answer="Each time you generate a build guide and prompts for a project idea, it counts as one build. You can view and export previously generated builds without using additional credits."
            />
            <FAQItem
              question="Can I upgrade or downgrade anytime?"
              answer="Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, your new rate takes effect at the next billing cycle."
            />
            <FAQItem
              question="What AI model powers BuildPrompt?"
              answer="We use xAI's Grok 4.1 Fast model, which provides excellent speed and quality for code-related tasks with a 2M token context window."
            />
            <FAQItem
              question="Is my project data secure?"
              answer="Absolutely. We don't store your project ideas on our servers after generating the guide. All data is encrypted in transit and we follow industry best practices for security."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} BuildPrompt AI. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  tier,
  info,
  isLoading,
  onSubscribe,
  isSignedIn,
  isPopular,
}: {
  tier: SubscriptionTier;
  info: (typeof SUBSCRIPTION_TIERS)[SubscriptionTier];
  isLoading: boolean;
  onSubscribe: () => void;
  isSignedIn: boolean | undefined;
  isPopular?: boolean;
}) {
  return (
    <Card className={isPopular ? "border-primary shadow-lg relative" : ""}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="capitalize">{tier}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">
            ${info.price}
          </span>
          {info.price > 0 && (
            <span className="text-muted-foreground">/month</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {info.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
          {tier === "free" && (
            <>
              <li className="flex items-start gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">Export to PDF</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">Priority support</span>
              </li>
            </>
          )}
        </ul>
      </CardContent>
      <CardFooter>
        {tier === "free" ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (!isSignedIn) {
                window.location.href = "/sign-up";
              }
            }}
          >
            {isSignedIn ? "Current Plan" : "Get Started Free"}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={onSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)}`
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-4">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
