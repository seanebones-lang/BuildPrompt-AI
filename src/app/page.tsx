"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { Sparkles, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuildForm } from "@/components/build-form";
import { BuildOutput } from "@/components/build-output";
import type { BuildResponse } from "@/types";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [buildResult, setBuildResult] = useState<BuildResponse | null>(null);

  const handleBuildComplete = (response: BuildResponse) => {
    setBuildResult(response);
  };

  const handleNewBuild = () => {
    setBuildResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">BuildPrompt AI</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <Button size="sm">Sign In</Button>
                  </SignInButton>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {buildResult ? (
          <div className="container mx-auto px-4 py-8">
            <BuildOutput build={buildResult} onNewBuild={handleNewBuild} />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="py-16 md:py-24">
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Transform Your Ideas into
                  <span className="text-primary"> Build Guides</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                  Describe your project idea and get a comprehensive build guide
                  with AI-ready prompts for Claude, Cursor, Replit, and more.
                </p>

                {!isSignedIn && isLoaded && (
                  <div className="flex items-center justify-center gap-4 mb-12">
                    <SignInButton mode="modal">
                      <Button size="lg" className="gap-2">
                        Get Started Free
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </SignInButton>
                    <Link href="/pricing">
                      <Button variant="outline" size="lg">
                        View Pricing
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Build Form */}
            <section className="pb-16">
              <div className="container mx-auto px-4">
                <BuildForm onBuildComplete={handleBuildComplete} />
              </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-muted/50">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                  Why BuildPrompt AI?
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <FeatureCard
                    icon={<Zap className="h-8 w-8 text-primary" />}
                    title="Always Up-to-Date"
                    description="Our guides reference the latest library versions, best practices, and modern patterns as of today."
                  />
                  <FeatureCard
                    icon={<Shield className="h-8 w-8 text-primary" />}
                    title="Security First"
                    description="Every guide includes secure coding practices. We validate outputs to prevent common vulnerabilities."
                  />
                  <FeatureCard
                    icon={<Clock className="h-8 w-8 text-primary" />}
                    title="Agent-Optimized"
                    description="Prompts are tailored for your specific coding agent - Claude, Cursor, Replit, or any other tool."
                  />
                </div>
              </div>
            </section>

            {/* Supported Agents */}
            <section className="py-16">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-8">
                  Works With Your Favorite Coding Agents
                </h2>
                <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
                  <AgentLogo name="Claude Projects" />
                  <AgentLogo name="Cursor" />
                  <AgentLogo name="Replit Agent" />
                  <AgentLogo name="VS Code + Copilot" />
                  <AgentLogo name="Windsurf" />
                  <AgentLogo name="And more..." />
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} BuildPrompt AI. All rights
            reserved.
          </p>
          <p className="mt-2">
            Powered by xAI Grok &bull; Built with Next.js 15
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function AgentLogo({ name }: { name: string }) {
  return (
    <div className="px-4 py-2 rounded-full border bg-background">
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}
