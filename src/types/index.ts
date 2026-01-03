// BuildPrompt AI Type Definitions

/**
 * Supported coding agents/environments
 */
export type CodingAgent =
  | "claude-projects"
  | "cursor"
  | "replit"
  | "vscode-copilot"
  | "windsurf"
  | "custom";

export interface CodingAgentInfo {
  id: CodingAgent;
  name: string;
  description: string;
  icon: string;
}

export const CODING_AGENTS: CodingAgentInfo[] = [
  {
    id: "claude-projects",
    name: "Claude Projects",
    description: "Anthropic's Claude with Projects feature",
    icon: "MessageSquare",
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-first code editor with Composer",
    icon: "MousePointer",
  },
  {
    id: "replit",
    name: "Replit Agent",
    description: "Replit's AI coding assistant",
    icon: "Terminal",
  },
  {
    id: "vscode-copilot",
    name: "VS Code + Copilot",
    description: "GitHub Copilot in Visual Studio Code",
    icon: "Code",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's agentic IDE",
    icon: "Waves",
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Specify your own coding environment",
    icon: "Settings",
  },
];

/**
 * User subscription tiers
 */
export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  monthlyBuilds: number;
  features: string[];
  price: number;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionInfo> = {
  free: {
    tier: "free",
    monthlyBuilds: 5,
    features: [
      "5 builds per month",
      "Basic build guides",
      "Community support",
    ],
    price: 0,
  },
  pro: {
    tier: "pro",
    monthlyBuilds: 100,
    features: [
      "100 builds per month",
      "Advanced guides with code examples",
      "Priority support",
      "Export to PDF",
      "Iterative refinements",
    ],
    price: 15,
  },
  enterprise: {
    tier: "enterprise",
    monthlyBuilds: -1, // Unlimited
    features: [
      "Unlimited builds",
      "Custom AI model fine-tuning",
      "Dedicated support",
      "Private instances",
      "Team management",
      "API access",
    ],
    price: 50,
  },
};

/**
 * Build request input from user
 */
export interface BuildRequest {
  idea: string;
  agent: CodingAgent;
  customAgent?: string;
  techStack?: string;
  additionalContext?: string;
}

/**
 * Individual prompt for the coding agent
 */
export interface AgentPrompt {
  title: string;
  description: string;
  prompt: string;
  order: number;
}

/**
 * Build guide step
 */
export interface BuildGuideStep {
  step: number;
  title: string;
  description: string;
  details: string;
  codeExample?: string;
  tips?: string[];
}

/**
 * Complete build response from AI
 */
export interface BuildResponse {
  id: string;
  projectName: string;
  summary: string;
  feasibilityScore: number; // 1-10
  techStackRecommendation: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    deployment?: string[];
    other?: string[];
  };
  guide: BuildGuideStep[];
  prompts: AgentPrompt[];
  estimatedComplexity: "beginner" | "intermediate" | "advanced";
  currentAsOf: string; // Date string
  generatedAt: string;
  tokensUsed: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * User usage tracking
 */
export interface UsageRecord {
  id: string;
  userId: string;
  buildId: string;
  tokensUsed: number;
  createdAt: string;
}

/**
 * User profile with subscription info
 */
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  buildsUsedThisMonth: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Grok API response structure
 */
export interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Form validation schema types
 */
export interface BuildFormData {
  idea: string;
  agent: CodingAgent;
  customAgent: string;
  techStack: string;
  additionalContext: string;
}
