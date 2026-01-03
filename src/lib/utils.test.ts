import { describe, it, expect } from "vitest";
import {
  cn,
  sanitizeInput,
  detectDangerousPatterns,
  checkForOutdatedReferences,
  safeJsonParse,
  extractJsonFromResponse,
  truncate,
  estimateReadTime,
  generateId,
} from "./utils";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("sanitizeInput", () => {
  it("should remove script tags", () => {
    const input = '<script>alert("xss")</script>Hello';
    expect(sanitizeInput(input)).toBe("Hello");
  });

  it("should remove javascript: protocol", () => {
    const input = 'Click javascript:alert("xss")';
    expect(sanitizeInput(input)).toBe("Click alert(\"xss\")");
  });

  it("should remove event handlers", () => {
    const input = '<div onclick="bad()">Hello</div>';
    expect(sanitizeInput(input)).toBe('<div "bad()">Hello</div>');
  });

  it("should keep normal text intact", () => {
    const input = "Normal project description with code examples";
    expect(sanitizeInput(input)).toBe(input);
  });
});

describe("detectDangerousPatterns", () => {
  it("should detect eval usage", () => {
    const content = 'eval("dangerous code")';
    expect(detectDangerousPatterns(content)).toContain("eval() usage");
  });

  it("should detect SQL DROP statements", () => {
    const content = "DROP TABLE users;";
    expect(detectDangerousPatterns(content)).toContain("SQL DROP statement");
  });

  it("should detect rm -rf", () => {
    const content = "rm -rf /";
    expect(detectDangerousPatterns(content)).toContain("Destructive shell command");
  });

  it("should return empty array for safe content", () => {
    const content = "const x = 5; console.log(x);";
    expect(detectDangerousPatterns(content)).toHaveLength(0);
  });
});

describe("checkForOutdatedReferences", () => {
  it("should detect outdated React versions", () => {
    const content = "Install React 16.8.0";
    expect(checkForOutdatedReferences(content)).toContain("React version < 18");
  });

  it("should detect outdated Node versions", () => {
    const content = "Requires Node.js 14.0.0";
    expect(checkForOutdatedReferences(content)).toContain("Node.js version < 20");
  });

  it("should return empty array for current versions", () => {
    const content = "Using React 19.0.0 and Node.js 22.4.0";
    expect(checkForOutdatedReferences(content)).toHaveLength(0);
  });
});

describe("safeJsonParse", () => {
  it("should parse valid JSON", () => {
    const json = '{"name": "test", "value": 42}';
    expect(safeJsonParse(json)).toEqual({ name: "test", value: 42 });
  });

  it("should return null for invalid JSON", () => {
    const invalid = "not json at all";
    expect(safeJsonParse(invalid)).toBeNull();
  });

  it("should handle arrays", () => {
    const json = "[1, 2, 3]";
    expect(safeJsonParse(json)).toEqual([1, 2, 3]);
  });
});

describe("extractJsonFromResponse", () => {
  it("should extract JSON from markdown code block", () => {
    const response = '```json\n{"key": "value"}\n```';
    expect(extractJsonFromResponse(response)).toBe('{"key": "value"}');
  });

  it("should extract raw JSON object", () => {
    const response = 'Some text {"key": "value"} more text';
    expect(extractJsonFromResponse(response)).toBe('{"key": "value"}');
  });

  it("should return original if no JSON found", () => {
    const response = "Plain text response";
    expect(extractJsonFromResponse(response)).toBe(response);
  });
});

describe("truncate", () => {
  it("should truncate long text", () => {
    const text = "This is a very long text that should be truncated";
    expect(truncate(text, 20)).toBe("This is a very lo...");
  });

  it("should not truncate short text", () => {
    const text = "Short";
    expect(truncate(text, 20)).toBe("Short");
  });
});

describe("estimateReadTime", () => {
  it("should estimate read time correctly", () => {
    const content = Array(400).fill("word").join(" "); // 400 words
    expect(estimateReadTime(content)).toBe(2); // 2 minutes at 200 wpm
  });

  it("should round up", () => {
    const content = Array(250).fill("word").join(" "); // 250 words
    expect(estimateReadTime(content)).toBe(2); // Rounds up from 1.25
  });
});

describe("generateId", () => {
  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("should start with bp_", () => {
    const id = generateId();
    expect(id.startsWith("bp_")).toBe(true);
  });
});
