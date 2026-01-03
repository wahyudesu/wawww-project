# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WhatsApp group chatbot built as a Cloudflare Worker. It integrates with the Waha (WhatsApp HTTP API) service to provide automated moderation, games, Islamic features, and AI-powered assistance to WhatsApp groups.

## Development Commands

### Local Development
```bash
bun run dev       # Start local development server (wrangler dev)
```

### Testing
```bash
bun run test      # Run tests (vitest)
```

### Database Operations (Drizzle ORM)
```bash
bun run generate  # Generate database migrations from schema changes
bun run migrate   # Apply migrations to database
bun run push      # Push schema changes directly to database (for dev)
```

### Deployment
```bash
bun run deploy    # Deploy to Cloudflare Workers
```

### Type Generation
```bash
bun run cf-typegen # Generate Cloudflare Worker types (updates worker-configuration.d.ts)
```

## Architecture

### Entry Point
- `src/index.ts` - Main Cloudflare Worker fetch handler, receives webhooks from Waha at `/event` endpoint

### Environment & Configuration
- **Secrets** (stored in Cloudflare Secrets Store, accessed via bindings):
  - `api_key` - Waha API key
  - `base_url_name` - Waha base URL
  - `session_name` - WhatsApp session name
  - `openrouter_key` - OpenRouter API key for AI features

- **Database**:
  - Uses PostgreSQL via Cloudflare Hyperdrive binding (`HYPERDRIVE`)
  - Drizzle ORM for database operations (`src/db/schema.ts`)
  - Schema includes: `group`, `participant_group`, `group_whatsapp`, `user`, `subscription`

- **Access Control**:
  - `src/config/env.ts` defines allowed `GroupIds` and `PersonalIds`
  - Bot only responds to messages from configured groups/personal contacts

### WhatsApp Integration (Waha API)
- **Configuration**: `src/config/waha.ts` provides `WahaConfigManager` class and helper functions
- **Group Utilities**: `src/functions/groupUtils.ts` handles:
  - `getGroupParticipants()` - Fetch group member list
  - `mentionAll()` - Mention all members (with filtered exclusions)
  - `isAdmin()` - Check if user is group admin (queries Waha API + database fallback)
  - `kickMember()`, `addMember()` - Member management
  - `closeGroup()`, `openGroup()` - Group settings

### Event Handlers
- `src/handler/in-group.ts` - Handles `group.v2.join` events, inserts group/participant data to database
- `src/handler/welcoming.ts` - Sends welcome messages to new group members (for `group.v2.participants` events)

### Commands & Features
- **Command routing**: All handled in `src/index.ts` via `/event` webhook endpoint
- **Available commands**:
  - `/tagall` - Mention all group members (with filtering)
  - `/ai <prompt>` - AI assistant using OpenRouter/Mistral
  - `/pantun` - Random Indonesian pantun (from `src/data/pantun.json`)
  - `/doaharian` - Random daily prayer (from `src/data/doaharian.json`)
  - `/bitcoin` - Fetch Bitcoin price (USD/IDR via CoinGecko API)
  - `/math` - Math quiz game
  - `/dev` - Developer info
  - `/help` - List all commands
  - `/kick <number>` - Remove member (admin only)
  - `/add <numbers>` - Add members (admin only)
  - `/closegroup` - Close group to admin-only messages (admin only)
  - `/opengroup` - Open group to all members (admin only)
  - `/debugadmin` - Debug admin status

For a detailed overview of all project features, see [project-features.md](./project-features.md).


### Toxic Message Detection
- `src/functions/toxic-handler.ts` - Checks messages for toxic language before processing commands
- If toxic, sends warning message and blocks further processing

### Helper Libraries
- `src/functions/lib/chatting.ts` - Helper functions for sending WhatsApp messages
- `src/functions/lib/groups.ts` - Group-related utilities

## Key Patterns

### WhatsApp ID Formats
- Personal chats: `{number}@c.us` (e.g., `6281234567890@c.us`)
- Group chats: `{id}@g.us` (e.g., `120363399604541928@g.us`)
- Waha API sometimes returns `@s.whatsapp.net` - normalize to `@c.us` for consistency

### Sending Messages
All message sends go through Waha API:
```typescript
await fetch(baseUrl + '/api/sendText', {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Api-Key': APIkey,
  },
  body: JSON.stringify({
    chatId,
    reply_to,
    text,
    session,
    mentions: [], // optional
  }),
});
```

### Cron Triggers
- Configured in `wrangler.jsonc` under `triggers.crons`
- Currently set to run daily at 07:00 GMT+7 (18:45 UTC)

## File Structure Notes

- TypeScript path alias `@/*` maps to `src/*`
- Static data files in `src/data/` (pantun, doa harian, etc.)
- Database schema in `src/db/schema.ts`
- Migrations generated to `drizzle/` directory
- Use `.dev.vars` for local environment variables (not in git)
