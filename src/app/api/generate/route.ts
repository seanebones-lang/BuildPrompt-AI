import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateBuild } from "@/lib/grok";
import { checkRateLimit, checkMonthlyLimit } from "@/lib/rate-limit";
import { getOrCreateUser, recordUsage, getUserMonthlyUsage } from "@/lib/supabase";
import { sanitizeInput, detectDangerousPatterns, checkForOutdatedReferences } from "@/lib/utils";
import type { BuildRequest, ApiResponse, BuildResponse } from "@/types";

export const maxDuration = 60; // Allow up to 60 seconds for AI generation

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<BuildResponse>>> {
  try {
    // Parse request body
    const body = await request.json();
    const { idea, agent, customAgent, techStack, additionalContext } = body as BuildRequest;

    // Validate required fields
    if (!idea || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Project idea and coding agent are required",
          },
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedRequest: BuildRequest = {
      idea: sanitizeInput(idea),
      agent,
      customAgent: customAgent ? sanitizeInput(customAgent) : undefined,
      techStack: techStack ? sanitizeInput(techStack) : undefined,
      additionalContext: additionalContext ? sanitizeInput(additionalContext) : undefined,
    };

    // Check authentication (optional - allow anonymous for demo)
    const { userId } = await auth();
    let userTier: "free" | "pro" | "enterprise" = "free";
    let buildsUsed = 0;

    if (userId) {
      // Get or create user in database
      const user = await getOrCreateUser(userId, "", "");
      if (user) {
        userTier = user.subscriptionTier;
        buildsUsed = await getUserMonthlyUsage(userId);
      }

      // Check rate limit
      const rateCheck = checkRateLimit(userId, userTier);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: `Rate limit exceeded. Try again in ${rateCheck.resetIn} seconds.`,
            },
          },
          { status: 429 }
        );
      }

      // Check monthly build limit
      const monthlyCheck = checkMonthlyLimit(buildsUsed, userTier);
      if (!monthlyCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MONTHLY_LIMIT_EXCEEDED",
              message: `You've used all ${monthlyCheck.limit} builds this month. Upgrade to continue.`,
            },
          },
          { status: 403 }
        );
      }
    }

    // Generate build using Grok API
    const buildResponse = await generateBuild(sanitizedRequest);

    // Validate AI output for security issues
    const fullContent = JSON.stringify(buildResponse);
    const dangerousPatterns = detectDangerousPatterns(fullContent);
    const outdatedRefs = checkForOutdatedReferences(fullContent);

    // Add warnings if issues detected
    if (dangerousPatterns.length > 0 || outdatedRefs.length > 0) {
      // Log for monitoring but don't block the response
      console.warn("Content warnings:", { dangerousPatterns, outdatedRefs, buildId: buildResponse.id });
    }

    // Record usage if authenticated
    if (userId) {
      await recordUsage(userId, buildResponse.id, buildResponse.tokensUsed);
    }

    return NextResponse.json({
      success: true,
      data: buildResponse,
    });
  } catch (error) {
    console.error("Generate API error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "API_CONFIG_ERROR",
              message: "AI service is not configured. Please contact support.",
            },
          },
          { status: 500 }
        );
      }

      if (error.message.includes("rate limit") || error.message.includes("429")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "AI_RATE_LIMIT",
              message: "AI service is busy. Please try again in a moment.",
            },
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate build. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    service: "buildprompt-ai-generate",
    timestamp: new Date().toISOString(),
  });
}
