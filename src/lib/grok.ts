import type {
  BuildRequest,
  BuildResponse,
  GrokResponse,
  BuildGuideStep,
  AgentPrompt,
} from "@/types";
import {
  getCurrentDateForPrompt,
  generateId,
  extractJsonFromResponse,
  safeJsonParse,
  retryWithBackoff,
  getISODate,
} from "./utils";

const XAI_API_BASE = process.env.XAI_API_BASE_URL || "https://api.x.ai/v1";
const XAI_API_KEY = process.env.XAI_API_KEY;

/**
 * Build the system prompt for Grok
 */
function buildSystemPrompt(): string {
  const currentDate = getCurrentDateForPrompt();

  return `You are BuildPrompt AI, an expert software architect and development guide generator. Your task is to analyze project ideas and create comprehensive, actionable build guides with tailored prompts for specific coding agents.

CRITICAL INSTRUCTIONS:
1. The current date is ${currentDate}. ALL recommendations must reference the latest stable versions of libraries, frameworks, and tools available as of this date.
2. For libraries and frameworks, always specify exact version numbers (e.g., "React 19.0.0", "Next.js 15.0.1", "Node.js 22.4.0").
3. Ignore any pre-2024 practices that have been superseded. Use modern patterns and best practices only.
4. Security is paramount - never suggest patterns that could introduce vulnerabilities (no eval(), no unsanitized inputs, proper authentication, etc.).
5. Structure your response ONLY as valid JSON matching the exact schema provided.

You must evaluate the feasibility of ideas honestly. If an idea has significant technical challenges or is not feasible with current technology, reflect this in your feasibilityScore and provide constructive alternatives.`;
}

/**
 * Build the user prompt for a build request
 */
function buildUserPrompt(request: BuildRequest): string {
  const agentSpecificInstructions = getAgentInstructions(request.agent);

  return `Generate a complete build guide and coding prompts for the following project:

PROJECT IDEA: ${request.idea}

CODING AGENT: ${request.agent}${request.customAgent ? ` (${request.customAgent})` : ""}

${request.techStack ? `PREFERRED TECH STACK: ${request.techStack}` : ""}

${request.additionalContext ? `ADDITIONAL CONTEXT: ${request.additionalContext}` : ""}

${agentSpecificInstructions}

Respond with ONLY a JSON object in the following exact structure (no markdown, no explanations outside JSON):

{
  "projectName": "string - A catchy, descriptive project name",
  "summary": "string - 2-3 sentence summary of what will be built",
  "feasibilityScore": number 1-10 (10 being highly feasible with current tech),
  "techStackRecommendation": {
    "frontend": ["array of recommended frontend technologies with versions"],
    "backend": ["array of recommended backend technologies with versions"],
    "database": ["array of recommended database solutions"],
    "deployment": ["array of deployment platforms"],
    "other": ["other tools, libraries, or services needed"]
  },
  "guide": [
    {
      "step": number,
      "title": "string - Step title",
      "description": "string - Brief description",
      "details": "string - Detailed explanation with code examples where relevant",
      "codeExample": "string or null - Actual code snippet if applicable",
      "tips": ["array of pro tips for this step"]
    }
  ],
  "prompts": [
    {
      "title": "string - Prompt title (e.g., 'Initial Setup')",
      "description": "string - What this prompt accomplishes",
      "prompt": "string - The actual prompt to paste into the coding agent",
      "order": number
    }
  ],
  "estimatedComplexity": "beginner" | "intermediate" | "advanced"
}

Generate at least 8-12 detailed guide steps and 4-6 actionable prompts tailored to the specified coding agent.`;
}

/**
 * Get agent-specific prompt instructions
 */
function getAgentInstructions(agent: string): string {
  const instructions: Record<string, string> = {
    "claude-projects": `AGENT-SPECIFIC INSTRUCTIONS FOR CLAUDE PROJECTS:
- Prompts should leverage Claude's multi-file project context
- Structure prompts to use Claude's artifact feature for code generation
- Include instructions to create project knowledge files
- Utilize Claude's ability to reference multiple files in a single conversation`,

    cursor: `AGENT-SPECIFIC INSTRUCTIONS FOR CURSOR:
- Prompts should be optimized for Cursor's Composer feature
- Include @file references for context when appropriate
- Structure tasks for Cursor's inline editing and chat modes
- Leverage Cursor's ability to apply changes across multiple files`,

    replit: `AGENT-SPECIFIC INSTRUCTIONS FOR REPLIT AGENT:
- Prompts should work with Replit's web-based development environment
- Include deployment instructions using Replit's hosting
- Consider Replit's package management and environment setup
- Optimize for Replit's collaborative features`,

    "vscode-copilot": `AGENT-SPECIFIC INSTRUCTIONS FOR VS CODE + COPILOT:
- Prompts should be structured for Copilot Chat
- Include context markers for Copilot to understand file structure
- Leverage Copilot's /fix, /explain, and /tests slash commands
- Structure for inline suggestions and chat-based development`,

    windsurf: `AGENT-SPECIFIC INSTRUCTIONS FOR WINDSURF:
- Prompts should leverage Windsurf's Cascade feature
- Structure for Windsurf's agentic multi-file editing
- Include flow-based development instructions
- Optimize for Windsurf's context understanding`,

    custom: `AGENT-SPECIFIC INSTRUCTIONS:
- Create generic but effective prompts
- Include clear context and requirements in each prompt
- Structure prompts to be self-contained and actionable
- Provide explicit success criteria for each task`,
  };

  return instructions[agent] || instructions.custom;
}

/**
 * Call the Grok API
 */
async function callGrokAPI(
  systemPrompt: string,
  userPrompt: string
): Promise<GrokResponse> {
  if (!XAI_API_KEY) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-4.1-fast",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Parse and validate Grok response
 */
function parseGrokResponse(
  content: string,
  tokensUsed: number
): BuildResponse | null {
  const jsonString = extractJsonFromResponse(content);
  const parsed = safeJsonParse<{
    projectName: string;
    summary: string;
    feasibilityScore: number;
    techStackRecommendation: BuildResponse["techStackRecommendation"];
    guide: BuildGuideStep[];
    prompts: AgentPrompt[];
    estimatedComplexity: BuildResponse["estimatedComplexity"];
  }>(jsonString);

  if (!parsed) {
    console.error("Failed to parse Grok response:", content.substring(0, 500));
    return null;
  }

  // Validate required fields
  if (
    !parsed.projectName ||
    !parsed.summary ||
    !Array.isArray(parsed.guide) ||
    !Array.isArray(parsed.prompts)
  ) {
    console.error("Invalid response structure from Grok");
    return null;
  }

  return {
    id: generateId(),
    projectName: parsed.projectName,
    summary: parsed.summary,
    feasibilityScore: Math.min(10, Math.max(1, parsed.feasibilityScore || 5)),
    techStackRecommendation: parsed.techStackRecommendation || {},
    guide: parsed.guide,
    prompts: parsed.prompts.sort((a, b) => a.order - b.order),
    estimatedComplexity: parsed.estimatedComplexity || "intermediate",
    currentAsOf: getCurrentDateForPrompt(),
    generatedAt: getISODate(),
    tokensUsed,
  };
}

/**
 * Generate a build guide and prompts for a project idea
 */
export async function generateBuild(
  request: BuildRequest
): Promise<BuildResponse> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(request);

  const response = await retryWithBackoff(
    () => callGrokAPI(systemPrompt, userPrompt),
    3,
    2000
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Grok API");
  }

  const tokensUsed = response.usage?.total_tokens || 0;
  const buildResponse = parseGrokResponse(content, tokensUsed);

  if (!buildResponse) {
    throw new Error("Failed to parse Grok response into valid build guide");
  }

  return buildResponse;
}

/**
 * Validate a project idea's feasibility (quick check)
 */
export async function validateIdea(
  idea: string
): Promise<{ valid: boolean; feedback?: string }> {
  const systemPrompt = `You are a quick project feasibility validator. Respond ONLY with JSON: {"valid": boolean, "feedback": "string"}`;
  const userPrompt = `Is this a valid, feasible software project idea that can be built with current technology? Idea: "${idea}"`;

  try {
    const response = await callGrokAPI(systemPrompt, userPrompt);
    const content = response.choices[0]?.message?.content || "";
    const parsed = safeJsonParse<{ valid: boolean; feedback?: string }>(
      extractJsonFromResponse(content)
    );
    return parsed || { valid: true };
  } catch {
    // Default to valid if check fails
    return { valid: true };
  }
}
