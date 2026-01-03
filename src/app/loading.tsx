import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        <span className="text-2xl font-bold">BuildPrompt AI</span>
      </div>
      <div className="w-full max-w-md space-y-4 px-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    </div>
  );
}
