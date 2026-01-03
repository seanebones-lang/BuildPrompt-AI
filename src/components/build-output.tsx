"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  BookOpen,
  Terminal,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { BuildResponse, BuildGuideStep, AgentPrompt } from "@/types";
import { estimateReadTime } from "@/lib/utils";

interface BuildOutputProps {
  build: BuildResponse;
  onNewBuild: () => void;
}

export function BuildOutput({ build, onNewBuild }: BuildOutputProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set([0, 1])
  );
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

  const toggleStep = (step: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(step)) {
      newExpanded.delete(step);
    } else {
      newExpanded.add(step);
    }
    setExpandedSteps(newExpanded);
  };

  const copyToClipboard = async (text: string, promptIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(promptIndex);
      toast({
        title: "Copied to clipboard",
        description: "The prompt is ready to paste into your coding agent.",
      });
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try selecting and copying manually.",
        variant: "destructive",
      });
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "success";
      case "intermediate":
        return "warning";
      case "advanced":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const readTime = estimateReadTime(
    build.guide.map((s) => s.details).join(" ")
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{build.projectName}</CardTitle>
              <CardDescription className="text-base">
                {build.summary}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onNewBuild}>
              New Build
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant={getComplexityColor(build.estimatedComplexity)}>
              {build.estimatedComplexity}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Feasibility: {build.feasibilityScore}/10
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{readTime} min read
            </Badge>
            <Badge variant="secondary">Current as of {build.currentAsOf}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tech Stack */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recommended Tech Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {build.techStackRecommendation.frontend &&
              build.techStackRecommendation.frontend.length > 0 && (
                <TechCategory
                  title="Frontend"
                  items={build.techStackRecommendation.frontend}
                />
              )}
            {build.techStackRecommendation.backend &&
              build.techStackRecommendation.backend.length > 0 && (
                <TechCategory
                  title="Backend"
                  items={build.techStackRecommendation.backend}
                />
              )}
            {build.techStackRecommendation.database &&
              build.techStackRecommendation.database.length > 0 && (
                <TechCategory
                  title="Database"
                  items={build.techStackRecommendation.database}
                />
              )}
            {build.techStackRecommendation.deployment &&
              build.techStackRecommendation.deployment.length > 0 && (
                <TechCategory
                  title="Deployment"
                  items={build.techStackRecommendation.deployment}
                />
              )}
            {build.techStackRecommendation.other &&
              build.techStackRecommendation.other.length > 0 && (
                <TechCategory
                  title="Other Tools"
                  items={build.techStackRecommendation.other}
                />
              )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Build Guide ({build.guide.length} steps)
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Agent Prompts ({build.prompts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-4 mt-4">
          {build.guide.map((step, index) => (
            <GuideStep
              key={step.step}
              step={step}
              isExpanded={expandedSteps.has(index)}
              onToggle={() => toggleStep(index)}
            />
          ))}
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4 mt-4">
          {build.prompts.map((prompt, index) => (
            <PromptCard
              key={prompt.order}
              prompt={prompt}
              index={index}
              isCopied={copiedPrompt === index}
              onCopy={() => copyToClipboard(prompt.prompt, index)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TechCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function GuideStep({
  step,
  isExpanded,
  onToggle,
}: {
  step: BuildGuideStep;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {step.step}
            </div>
            <div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");

                  if (match) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {step.details}
            </ReactMarkdown>
          </div>

          {step.codeExample && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Code Example:</h4>
              <SyntaxHighlighter
                style={oneDark}
                language="typescript"
                PreTag="div"
              >
                {step.codeExample}
              </SyntaxHighlighter>
            </div>
          )}

          {step.tips && step.tips.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Pro Tips:</h4>
              <ul className="text-sm space-y-1">
                {step.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function PromptCard({
  prompt,
  index,
  isCopied,
  onCopy,
}: {
  prompt: AgentPrompt;
  index: number;
  isCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Prompt {index + 1}</Badge>
              <CardTitle className="text-lg">{prompt.title}</CardTitle>
            </div>
            <CardDescription className="mt-1">
              {prompt.description}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="flex items-center gap-2"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {prompt.prompt}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
