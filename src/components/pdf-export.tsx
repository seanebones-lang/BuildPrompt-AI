"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { BuildResponse } from "@/types";

interface PDFExportProps {
  build: BuildResponse;
  isPro: boolean;
}

export function PDFExport({ build, isPro }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!isPro) {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to export builds as PDF",
        variant: "default",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Generate HTML content for PDF
      const htmlContent = generatePDFContent(build);

      // Create a blob and trigger download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast({
        title: "PDF Ready",
        description: "Use your browser's print dialog to save as PDF",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting || !isPro}
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isPro ? "Export PDF" : "Pro: Export PDF"}
    </Button>
  );
}

function generatePDFContent(build: BuildResponse): string {
  const guideSteps = build.guide
    .map(
      (step) => `
        <div class="step">
          <h3>Step ${step.step}: ${step.title}</h3>
          <p class="description">${step.description}</p>
          <div class="details">${step.details}</div>
          ${step.codeExample ? `<pre class="code">${escapeHtml(step.codeExample)}</pre>` : ""}
          ${
            step.tips && step.tips.length > 0
              ? `
            <div class="tips">
              <strong>Pro Tips:</strong>
              <ul>
                ${step.tips.map((tip) => `<li>${tip}</li>`).join("")}
              </ul>
            </div>
          `
              : ""
          }
        </div>
      `
    )
    .join("");

  const prompts = build.prompts
    .map(
      (prompt) => `
        <div class="prompt">
          <h4>Prompt ${prompt.order}: ${prompt.title}</h4>
          <p class="description">${prompt.description}</p>
          <pre class="prompt-text">${escapeHtml(prompt.prompt)}</pre>
        </div>
      `
    )
    .join("");

  const techStack = Object.entries(build.techStackRecommendation)
    .filter(([, values]) => values && values.length > 0)
    .map(
      ([category, values]) => `
        <div class="tech-category">
          <strong>${capitalizeFirst(category)}:</strong> ${(values as string[]).join(", ")}
        </div>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${build.projectName} - BuildPrompt AI</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #333;
        }
        h1 { color: #7c3aed; margin-bottom: 10px; }
        h2 { color: #4b5563; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 40px; }
        h3 { color: #374151; margin-top: 30px; }
        h4 { color: #4b5563; }
        .header { border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
        .summary { font-size: 1.1em; color: #6b7280; margin-bottom: 20px; }
        .meta { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .meta-item { background: #f3f4f6; padding: 8px 16px; border-radius: 20px; font-size: 0.9em; }
        .tech-stack { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .tech-category { margin: 8px 0; }
        .step { margin: 30px 0; padding: 20px; border-left: 4px solid #7c3aed; background: #fafafa; }
        .description { color: #6b7280; font-style: italic; }
        .details { margin-top: 15px; }
        .code, .prompt-text {
          background: #1f2937;
          color: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 0.85em;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .tips { background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 15px; }
        .tips ul { margin: 10px 0 0 20px; }
        .prompt { margin: 25px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 0.9em; }
        @media print {
          body { padding: 20px; }
          .step { break-inside: avoid; }
          .prompt { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${build.projectName}</h1>
        <p class="summary">${build.summary}</p>
        <div class="meta">
          <span class="meta-item">Complexity: ${build.estimatedComplexity}</span>
          <span class="meta-item">Feasibility: ${build.feasibilityScore}/10</span>
          <span class="meta-item">Current as of: ${build.currentAsOf}</span>
        </div>
      </div>

      <h2>Tech Stack Recommendations</h2>
      <div class="tech-stack">
        ${techStack}
      </div>

      <h2>Build Guide</h2>
      ${guideSteps}

      <h2>Agent Prompts</h2>
      ${prompts}

      <div class="footer">
        <p>Generated by BuildPrompt AI on ${new Date().toLocaleDateString()}</p>
        <p>https://buildprompt.ai</p>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
