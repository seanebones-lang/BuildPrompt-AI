import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceSupabase, TABLES } from "@/lib/supabase";
import type { BuildResponse } from "@/types";

/**
 * GET /api/builds - Fetch user's build history
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const supabase = getServiceSupabase();

    // Get total count
    const { count } = await supabase
      .from(TABLES.BUILDS)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get builds with pagination
    const { data: builds, error } = await supabase
      .from(TABLES.BUILDS)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching builds:", error);
      return NextResponse.json(
        { error: "Failed to fetch builds" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      builds: builds || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Builds API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch builds" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/builds - Save a build to history
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const build: BuildResponse & { idea: string } = body;

    if (!build.id || !build.projectName) {
      return NextResponse.json(
        { error: "Invalid build data" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase.from(TABLES.BUILDS).insert({
      id: build.id,
      user_id: userId,
      project_name: build.projectName,
      summary: build.summary,
      idea: build.idea || "",
      agent: "unknown",
      feasibility_score: build.feasibilityScore,
      estimated_complexity: build.estimatedComplexity,
      tech_stack: build.techStackRecommendation,
      guide: build.guide,
      prompts: build.prompts,
      tokens_used: build.tokensUsed,
      current_as_of: build.currentAsOf,
    });

    if (error) {
      // Handle duplicate key error gracefully
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "Build already saved" });
      }
      console.error("Error saving build:", error);
      return NextResponse.json(
        { error: "Failed to save build" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save build error:", error);
    return NextResponse.json(
      { error: "Failed to save build" },
      { status: 500 }
    );
  }
}
