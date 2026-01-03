import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BuildPrompt AI - Transform Ideas into Build Guides",
  description:
    "Generate comprehensive build guides and AI-ready prompts for your project ideas. Supports Claude, Cursor, Replit, VS Code Copilot, and more.",
  keywords: [
    "AI coding",
    "build guide",
    "project generator",
    "Claude prompts",
    "Cursor",
    "Replit",
    "GitHub Copilot",
    "code generation",
  ],
  authors: [{ name: "BuildPrompt AI" }],
  openGraph: {
    title: "BuildPrompt AI - Transform Ideas into Build Guides",
    description:
      "Generate comprehensive build guides and AI-ready prompts for your project ideas.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BuildPrompt AI",
    description:
      "Transform project ideas into comprehensive build guides with AI-ready prompts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider defaultTheme="system" storageKey="buildprompt-theme">
            {children}
            <Toaster />
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
