import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceSupabase, TABLES } from "@/lib/supabase";

/**
 * GET /api/builds/[id] - Fetch a specific build
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = getServiceSupabase();

    const { data: build, error } = await supabase
      .from(TABLES.BUILDS)
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !build) {
      return NextResponse.json(
        { error: "Build not found" },
        { status: 404 }
      );
    }

    // Transform database format to API format
    const formattedBuild = {
      id: build.id,
      projectName: build.project_name,
      summary: build.summary,
      idea: build.idea,
      feasibilityScore: build.feasibility_score,
      estimatedComplexity: build.estimated_complexity,
      techStackRecommendation: build.tech_stack,
      guide: build.guide,
      prompts: build.prompts,
      tokensUsed: build.tokens_used,
      currentAsOf: build.current_as_of,
      generatedAt: build.created_at,
    };

    return NextResponse.json({ build: formattedBuild });
  } catch (error) {
    console.error("Fetch build error:", error);
    return NextResponse.json(
      { error: "Failed to fetch build" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/builds/[id] - Delete a build
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from(TABLES.BUILDS)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting build:", error);
      return NextResponse.json(
        { error: "Failed to delete build" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete build error:", error);
    return NextResponse.json(
      { error: "Failed to delete build" },
      { status: 500 }
    );
  }
}
