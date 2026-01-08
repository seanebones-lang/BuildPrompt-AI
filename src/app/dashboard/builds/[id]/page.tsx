"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BuildOutput } from "@/components/build-output";
import { toast } from "@/hooks/use-toast";
import type { BuildResponse } from "@/types";

export default function BuildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [build, setBuild] = useState<BuildResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBuild() {
      try {
        const response = await fetch(`/api/builds/${id}`);
        if (response.ok) {
          const data = await response.json();
          setBuild(data.build);
        } else if (response.status === 404) {
          setError("Build not found");
        } else {
          setError("Failed to load build");
        }
      } catch (err) {
        setError("Failed to load build");
        console.error("Error fetching build:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (isSignedIn && id) {
      fetchBuild();
    }
  }, [isSignedIn, id]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="min-h-screen">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">BuildPrompt AI</span>
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {error || "Build not found"}
          </h1>
          <p className="text-muted-foreground mb-8">
            The build you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/dashboard/history">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
          </Link>
        </main>
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
          </div>
          <Link href="/dashboard/history">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <BuildOutput
          build={build}
          onNewBuild={() => {
            toast({
              title: "Viewing saved build",
              description: "Go to the dashboard to create a new build",
            });
          }}
        />
      </main>
    </div>
  );
}
