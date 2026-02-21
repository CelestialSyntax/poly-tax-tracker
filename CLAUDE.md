# PolyTax Tracker

## About
Polymarket tax tracking web app. Tracks trades, calculates taxes across 3 IRS treatment modes (capital gains, gambling income, business income), and generates Excel/PDF/Word reports.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **UI**: shadcn/ui + Tailwind CSS 4 + Framer Motion
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: NextAuth v5 (email/password + SIWE wallet)
- **AI**: Anthropic SDK + Vercel AI SDK
- **Exports**: exceljs, @react-pdf/renderer, docx
- **Runtime**: Bun (always use `bun`, not `npm`)

## Key Architecture
- Multi-user SaaS with JWT sessions
- External trade API at `POST /api/v1/trades` for Telegram bot ingestion
- 3 tax treatment modes: capital_gains, gambling, business
- Cost basis methods: FIFO (default), LIFO, Specific ID
- Tax lot tracking for precise gain/loss calculations

## Commands
```sh
bun run dev          # Start dev server
bun run build        # Build for production
bun run typecheck    # Type check
bun run lint         # Lint
bun run db:push      # Push schema to Neon
bun run db:generate  # Generate migrations
```

## Project Structure
- `src/app/` - Next.js pages and API routes
- `src/components/` - React components (ui/, landing/, dashboard/, etc.)
- `src/lib/db/` - Drizzle schema and connection
- `src/lib/tax/` - Tax calculation engine
- `src/lib/polymarket/` - Polymarket API client
- `src/lib/export/` - Excel/PDF/Word generation
- `src/lib/auth/` - NextAuth configuration
- `src/lib/agent/` - Claude AI agent setup
- `src/hooks/` - React hooks
