# BuildPrompt AI

> Transform project ideas into comprehensive build guides with AI-ready prompts for Claude, Cursor, Replit, and more.

BuildPrompt AI is a modern web application that helps developers quickly scaffold and plan their projects by generating detailed build guides and tailored prompts for various AI coding assistants.

## Features

- **AI-Powered Build Guides**: Generate step-by-step development guides for any project idea
- **Agent-Specific Prompts**: Get prompts optimized for Claude Projects, Cursor, Replit, VS Code Copilot, Windsurf, and more
- **Always Up-to-Date**: All recommendations reference the latest library versions and best practices
- **Security-First**: Output validation to prevent common vulnerabilities
- **Freemium Model**: Start free with 5 builds/month, upgrade for more

## Tech Stack

- **Frontend**: Next.js 15 with React 19, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API Routes with TypeScript
- **AI**: xAI Grok API (grok-4.1-fast model)
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 22+
- npm or yarn
- API keys for:
  - [xAI](https://console.x.ai) - AI generation
  - [Clerk](https://dashboard.clerk.com) - Authentication
  - [Supabase](https://supabase.com) - Database
  - [Stripe](https://dashboard.stripe.com) - Payments

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/seanebones-lang/BuildPrompt-AI.git
   cd BuildPrompt-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your `.env.local` with your API keys (see `.env.example` for all required variables)

5. Set up the database:
   - Create a new project in Supabase
   - Run the schema from `supabase/schema.sql` in the SQL Editor

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── generate/      # Build generation endpoint
│   │   ├── billing/       # Stripe checkout & portal
│   │   ├── webhooks/      # Stripe webhooks
│   │   └── user/          # User data endpoints
│   ├── dashboard/         # User dashboard
│   ├── pricing/           # Pricing page
│   ├── sign-in/           # Clerk sign-in
│   └── sign-up/           # Clerk sign-up
├── components/            # React components
│   ├── ui/               # Shadcn/UI components
│   ├── build-form.tsx    # Main input form
│   ├── build-output.tsx  # Results display
│   └── toaster.tsx       # Toast notifications
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── grok.ts           # xAI Grok API client
│   ├── stripe.ts         # Stripe integration
│   ├── supabase.ts       # Database client
│   ├── rate-limit.ts     # Rate limiting
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript types
└── middleware.ts         # Clerk auth middleware
```

## API Reference

### POST /api/generate

Generate a build guide and prompts for a project idea.

**Request Body:**
```json
{
  "idea": "A mobile app for tracking fitness goals",
  "agent": "claude-projects",
  "techStack": "React Native, Node.js",
  "additionalContext": "Focus on social features"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "bp_xxx",
    "projectName": "FitTrack Social",
    "summary": "...",
    "feasibilityScore": 8,
    "techStackRecommendation": {...},
    "guide": [...],
    "prompts": [...],
    "estimatedComplexity": "intermediate",
    "currentAsOf": "January 3, 2026"
  }
}
```

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `XAI_API_KEY` | xAI Grok API key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |

See `.env.example` for the complete list.

## Supported Coding Agents

BuildPrompt AI generates tailored prompts for:

- **Claude Projects** - Leverages multi-file context and artifacts
- **Cursor** - Optimized for Composer and inline editing
- **Replit Agent** - Web-based development environment
- **VS Code + Copilot** - GitHub Copilot Chat integration
- **Windsurf** - Cascade-based agentic development
- **Custom** - Generic prompts for any AI assistant

## Subscription Tiers

| Feature | Free | Pro ($15/mo) | Enterprise ($50/mo) |
|---------|------|--------------|---------------------|
| Builds/month | 5 | 100 | Unlimited |
| Build guides | Basic | Advanced | Custom |
| Export to PDF | - | Yes | Yes |
| Priority support | - | Yes | Dedicated |
| API access | - | - | Yes |

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run test         # Run tests
```

### Code Quality

- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Vitest for unit testing
- Playwright for E2E testing

## Security

BuildPrompt AI implements several security measures:

- Input sanitization to prevent injection attacks
- AI output validation for dangerous patterns
- CSP headers and HTTPS enforcement
- Row-level security in Supabase
- Environment variable protection
- Rate limiting per user and tier

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app is framework-agnostic and can be deployed to any platform supporting Node.js 22+.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [xAI](https://x.ai) for the Grok API
- [Vercel](https://vercel.com) for Next.js
- [Clerk](https://clerk.com) for authentication
- [Supabase](https://supabase.com) for the database
- [Stripe](https://stripe.com) for payments
- [Shadcn](https://ui.shadcn.com) for UI components

---

Built with love by the BuildPrompt AI team. Questions? Open an issue or reach out at support@buildprompt.ai
