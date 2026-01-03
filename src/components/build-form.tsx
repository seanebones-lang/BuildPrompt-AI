"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CODING_AGENTS, type CodingAgent, type BuildResponse } from "@/types";
import { sanitizeInput } from "@/lib/utils";

const buildFormSchema = z.object({
  idea: z
    .string()
    .min(10, "Please describe your project idea in at least 10 characters")
    .max(2000, "Project idea must be less than 2000 characters"),
  agent: z.enum([
    "claude-projects",
    "cursor",
    "replit",
    "vscode-copilot",
    "windsurf",
    "custom",
  ] as const),
  customAgent: z.string().optional(),
  techStack: z.string().max(500).optional(),
  additionalContext: z.string().max(1000).optional(),
});

type BuildFormValues = z.infer<typeof buildFormSchema>;

interface BuildFormProps {
  onBuildComplete: (response: BuildResponse) => void;
  remainingBuilds?: number;
}

export function BuildForm({ onBuildComplete, remainingBuilds }: BuildFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<BuildFormValues>({
    resolver: zodResolver(buildFormSchema),
    defaultValues: {
      idea: "",
      agent: "claude-projects",
      customAgent: "",
      techStack: "",
      additionalContext: "",
    },
  });

  const selectedAgent = form.watch("agent");

  async function onSubmit(data: BuildFormValues) {
    if (remainingBuilds !== undefined && remainingBuilds <= 0) {
      toast({
        title: "Build limit reached",
        description:
          "You've used all your builds this month. Upgrade to Pro for more!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedData = {
        idea: sanitizeInput(data.idea),
        agent: data.agent,
        customAgent: data.customAgent ? sanitizeInput(data.customAgent) : undefined,
        techStack: data.techStack ? sanitizeInput(data.techStack) : undefined,
        additionalContext: data.additionalContext
          ? sanitizeInput(data.additionalContext)
          : undefined,
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to generate build");
      }

      if (result.success && result.data) {
        onBuildComplete(result.data);
        toast({
          title: "Build generated!",
          description: `Your guide for "${result.data.projectName}" is ready.`,
          variant: "default",
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Build Your Idea
        </CardTitle>
        <CardDescription>
          Describe your project and we&apos;ll generate a complete build guide
          with AI-ready prompts.
          {remainingBuilds !== undefined && (
            <span className="ml-2 text-muted-foreground">
              ({remainingBuilds} builds remaining this month)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Idea */}
          <div className="space-y-2">
            <Label htmlFor="idea">Project Idea *</Label>
            <Textarea
              id="idea"
              placeholder="e.g., A mobile app for tracking fitness goals with social features and AI-powered workout recommendations..."
              className="min-h-[120px] resize-none"
              {...form.register("idea")}
              disabled={isLoading}
            />
            {form.formState.errors.idea && (
              <p className="text-sm text-destructive">
                {form.formState.errors.idea.message}
              </p>
            )}
          </div>

          {/* Coding Agent */}
          <div className="space-y-2">
            <Label htmlFor="agent">Coding Agent *</Label>
            <Select
              value={form.watch("agent")}
              onValueChange={(value: CodingAgent) =>
                form.setValue("agent", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="agent">
                <SelectValue placeholder="Select your coding environment" />
              </SelectTrigger>
              <SelectContent>
                {CODING_AGENTS.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{agent.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {agent.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.agent && (
              <p className="text-sm text-destructive">
                {form.formState.errors.agent.message}
              </p>
            )}
          </div>

          {/* Custom Agent Input (shown when custom is selected) */}
          {selectedAgent === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customAgent">Custom Agent Name</Label>
              <Input
                id="customAgent"
                placeholder="e.g., Aider, Continue.dev, Cody..."
                {...form.register("customAgent")}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Advanced Options Toggle */}
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
            Advanced Options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label htmlFor="techStack">Preferred Tech Stack</Label>
                <Input
                  id="techStack"
                  placeholder="e.g., React Native, Node.js, PostgreSQL..."
                  {...form.register("techStack")}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for AI recommendations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalContext">Additional Context</Label>
                <Textarea
                  id="additionalContext"
                  placeholder="Any specific requirements, constraints, or preferences..."
                  className="min-h-[80px] resize-none"
                  {...form.register("additionalContext")}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || (remainingBuilds !== undefined && remainingBuilds <= 0)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating your build...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Build Guide
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
