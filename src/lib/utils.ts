import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "luxon";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get current date formatted for AI prompts
 * Format: "January 3, 2026"
 */
export function getCurrentDateForPrompt(): string {
  return DateTime.now().setZone("UTC").toFormat("LLLL d, yyyy");
}

/**
 * Get ISO date string for database storage
 */
export function getISODate(): string {
  return DateTime.now().setZone("UTC").toISO() ?? new Date().toISOString();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return DateTime.fromISO(dateString).toFormat("LLL d, yyyy 'at' h:mm a");
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `bp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Validate that a string doesn't contain potential security issues
 */
export function sanitizeInput(input: string): string {
  // Remove potential script injections
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

/**
 * Check if AI output contains potentially dangerous code patterns
 */
export function detectDangerousPatterns(content: string): string[] {
  const dangerousPatterns = [
    { pattern: /eval\s*\(/gi, name: "eval() usage" },
    { pattern: /exec\s*\(/gi, name: "exec() usage" },
    { pattern: /process\.env/gi, name: "Direct env access" },
    { pattern: /rm\s+-rf/gi, name: "Destructive shell command" },
    { pattern: /DROP\s+TABLE/gi, name: "SQL DROP statement" },
    { pattern: /DELETE\s+FROM\s+\w+\s*;/gi, name: "SQL DELETE without WHERE" },
  ];

  const detected: string[] = [];
  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(content)) {
      detected.push(name);
    }
  }
  return detected;
}

/**
 * Check if library version appears outdated
 * Basic heuristic check - warns about pre-2024 versions
 */
export function checkForOutdatedReferences(content: string): string[] {
  const outdatedPatterns = [
    { pattern: /React\s+1[0-7]\./gi, name: "React version < 18" },
    { pattern: /Next\.?js\s+1[0-3]\./gi, name: "Next.js version < 14" },
    { pattern: /Node\.?js?\s+1[0-8]\./gi, name: "Node.js version < 20" },
    { pattern: /Python\s+3\.[0-9]\./gi, name: "Python version < 3.10" },
    { pattern: /TypeScript\s+[0-4]\./gi, name: "TypeScript version < 5" },
  ];

  const warnings: string[] = [];
  for (const { pattern, name } of outdatedPatterns) {
    if (pattern.test(content)) {
      warnings.push(name);
    }
  }
  return warnings;
}

/**
 * Parse JSON safely with error handling
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Extract JSON from AI response that may have markdown formatting
 */
export function extractJsonFromResponse(response: string): string {
  // Try to find JSON in code blocks first
  const jsonBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }

  // Try to find raw JSON object or array
  const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  return response;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Calculate estimated read time for content
 */
export function estimateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
