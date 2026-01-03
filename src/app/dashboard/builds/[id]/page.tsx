"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuildOutput } from "@/components/build-output";
import { toast } from "@/hooks/use-toast";
import type { BuildResponse } from "@/types";

export default function BuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [build, setBuild] = useState<BuildResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status === 404 ? "Not found" : "Error"))
      .then((data) => setBuild(data.build))
      .catch((e) => setError(e))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error || !build) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">{error || "Build not found"}</h1>
        <Link href="/dashboard/history"><Button><ArrowLeft className="mr-2 h-4 w-4" />Back to History</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/history">
        <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to History</Button>
      </Link>
      <BuildOutput build={build} onNewBuild={() => toast({ title: "Viewing saved build", description: "Go to dashboard to create new" })} />
    </div>
  );
}
