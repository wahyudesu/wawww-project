# Project Structure

This document provides a detailed overview of the project's file organization and architecture.

## Directory Structure

```
z0-project-latest/
├── .dev.vars             # Local environment variables (not in git)
├── _docs/                # Project documentation
│   ├── project-features.md   # Detailed feature list
│   └── project-sctructure.md # This file
├── drizzle/              # Database migrations
│   └── meta/             # Migration metadata
├── event/                # Event-related files
├── src/                  # Source code
│   ├── config/           # Configuration modules
│   ├── data/             # Static data files
│   │   └── randompics/   # Random images
│   ├── db/               # Database modules
│   ├── functions/        # Core functionality
│   │   ├── lib/          # Helper libraries
│   │   ├── scripts/      # Utility scripts
│   │   └── services/     # Service modules
│   ├── handler/          # Event handlers
│   ├── index.ts          # Main entry point
│   └── types.ts          # TypeScript type definitions
├── AGENTS.md             # Agent guidance (alias for CLAUDE.md)
├── CLAUDE.md             # Claude Code instructions
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── wrangler.jsonc        # Cloudflare Worker configuration
└── worker-configuration.d.ts  # Worker type definitions
```

## Key Modules

| Path | Purpose |
|------|---------|
| `config/env.ts` | Access control (GroupIds, PersonalIds) |
| `config/waha.ts` | Waha API integration |
| `db/schema.ts` | Database schema definitions |
| `db/queries.ts` | Database query functions |
| `functions/messageHandlers.ts` | Command routing |
| `functions/groupUtils.ts` | Group management operations |
| `functions/ai-agent.ts` | AI assistant |
| `functions/toxic-handler.ts` | Toxic message detection |
| `handler/in-group.ts` | Group join events |
| `handler/welcoming.ts` | Welcome new members |
| `handler/out-group.ts` | Group exit events |

## Data Flow

```
Waha Webhook → src/index.ts → Handler → Functions → Database → Response
```

1. Waha sends webhook to `/event` endpoint
2. `src/index.ts` routes to appropriate handler
3. Handler processes event using functions
4. Functions query/update database via `/src/db/`
5. Response sent via Waha API

## Core Modules

### `/src/config/`
Configuration and environment management
- `env.ts` - Access control lists (GroupIds, PersonalIds)
- `waha.ts` - WahaConfigManager class and API helpers

### `/src/db/`
Database layer using Drizzle ORM
- `schema.ts` - Database schema definitions
- `queries.ts` - Database query functions

### `/src/functions/`
Core bot functionality and features
- `index.ts` - Main function exports
- `messageHandlers.ts` - Message routing and command handling
- `groupUtils.ts` - Group management utilities
- `ai-agent.ts` - AI assistant integration
- `math.ts` - Math quiz functionality
- `mathQuiz.ts` - Math quiz game logic
- `toxic-handler.ts` - Toxic message detection
- `instagramDownloader.ts` - Instagram content downloader

#### `/src/functions/lib/`
Helper libraries
- `chatting.ts` - WhatsApp message sending helpers
- `groups.ts` - Group-related utilities

#### `/src/functions/services/`
Service modules
- `groupService.ts` - Group management service

#### `/src/functions/scripts/`
Utility scripts
- `send-to-owner.ts` - Send messages to bot owner
- `fetch-group.ts` - Fetch group information

### `/src/handler/`
Event handlers for WhatsApp events
- `in-group.ts` - Handle `group.v2.join` events
- `out-group.ts` - Handle group exit events
- `welcoming.ts` - Welcome new members
- `ai-cron-test.ts` - Test AI cron functionality

### `/src/data/`
Static data files
- `pantun.json` - Indonesian pantun collection
- `doaharian.json` - Daily Islamic prayers
- `randompics/` - Random image assets

## Entry Point

**`src/index.ts`** - Main Cloudflare Worker entry point
- Receives webhooks from Waha at `/event` endpoint
- Routes commands to appropriate handlers
- Manages message flow and error handling

## Type Definitions

**`src/types.ts`** - Shared TypeScript types
- Message types
- Event types
- Configuration types

## Configuration Files

### `package.json`
Defines project metadata, dependencies, and npm scripts:
- `dev` - Start local development server
- `deploy` - Deploy to Cloudflare Workers
- `test` - Run tests with Vitest
- `generate/migrate/push` - Database operations

### `wrangler.jsonc`
Cloudflare Worker configuration:
- Worker name and settings
- Environment bindings (HYPERDRIVE, secrets)
- Cron triggers for scheduled tasks
- KV namespace bindings

### `tsconfig.json`
TypeScript compiler configuration:
- Path aliases: `@/*` → `src/*`
- Target and module settings
- Type checking options

## Key Architectural Patterns

### Service Layer
- **Handlers** (`/src/handler/`) - Process WhatsApp events
- **Functions** (`/src/functions/`) - Core business logic
- **Services** (`/src/functions/services/`) - Reusable service modules
- **Libraries** (`/src/functions/lib/`) - Helper utilities

### Data Flow
1. Waha sends webhook → `src/index.ts`
2. Event routed to handler in `/src/handler/`
3. Handler uses functions from `/src/functions/`
4. Functions interact with database via `/src/db/`
5. Response sent via Waha API

### Separation of Concerns
- **Configuration** - Isolated in `/src/config/`
- **Business Logic** - Core functions in `/src/functions/`
- **Data Access** - Database operations in `/src/db/`
- **Event Handling** - WhatsApp events in `/src/handler/`
