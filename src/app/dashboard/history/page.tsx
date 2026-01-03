"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { History, Trash2, ExternalLink, Loader2, ChevronLeft, ChevronRight, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Build {
  id: string;
  project_name: string;
  summary: string;
  feasibility_score: number;
  estimated_complexity: string;
  created_at: string;
}

export default function BuildHistoryPage() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBuilds = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/builds?page=${p}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setBuilds(data.builds);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load builds", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBuilds(page); }, [page]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/builds/${id}`, { method: "DELETE" });
      setBuilds(builds.filter((b) => b.id !== id));
      toast({ title: "Deleted", description: "Build removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const complexityVariant = (c: string) =>
    c === "beginner" ? "success" : c === "intermediate" ? "warning" : "destructive";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Build History</h1>
          <p className="text-muted-foreground">Your previously generated builds</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : builds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No builds yet</h3>
            <Link href="/dashboard"><Button>Create a Build</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {builds.map((b) => (
              <Card key={b.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{b.project_name}</CardTitle>
                      <CardDescription className="line-clamp-2">{b.summary}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/builds/${b.id}`}>
                        <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4 mr-1" />View</Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id} className="text-destructive hover:text-destructive">
                        {deletingId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant={complexityVariant(b.estimated_complexity)}>{b.estimated_complexity}</Badge>
                    <Badge variant="outline"><Zap className="h-3 w-3 mr-1" />{b.feasibility_score}/10</Badge>
                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{formatDate(b.created_at)}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <span className="text-sm text-muted-foreground self-center">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
