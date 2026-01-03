"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Sparkles,
  History,
  Trash2,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface BuildHistoryItem {
  id: string;
  project_name: string;
  summary: string;
  feasibility_score: number;
  estimated_complexity: string;
  created_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BuildHistoryPage() {
  const { isSignedIn } = useAuth();
  const [builds, setBuilds] = useState<BuildHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBuilds = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/builds?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setBuilds(data.builds);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch builds:", error);
      toast({
        title: "Error",
        description: "Failed to load build history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchBuilds();
    }
  }, [isSignedIn]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/builds/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBuilds(builds.filter((b) => b.id !== id));
        toast({
          title: "Deleted",
          description: "Build removed from history",
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete build",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
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

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your build history.
            </CardDescription>
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
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Build History</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Build History</h1>
            <p className="text-muted-foreground">
              View and manage your previously generated builds
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : builds.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No builds yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first build to see it here
              </p>
              <Link href="/dashboard">
                <Button>Create a Build</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {builds.map((build) => (
                <Card key={build.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {build.project_name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {build.summary}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/builds/${build.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(build.id)}
                          disabled={deletingId === build.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {deletingId === build.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant={getComplexityColor(build.estimated_complexity)}>
                        {build.estimated_complexity}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {build.feasibility_score}/10
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(build.created_at)}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchBuilds(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchBuilds(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
