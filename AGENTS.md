# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Structure

This project uses a hierarchical documentation system:

- **AGENTS.md** (this file) - Primary guidance for Claude Code agents
- **_docs/project-features.md** - Detailed feature matrix and implementation status
- **_docs/project-sctructure.md** - Complete directory structure and module organization

When working with this codebase:
1. Start here for architectural context and development patterns
2. Refer to `project-features.md` for feature specifications and implementation status
3. Consult `project-sctructure.md` for file organization and module relationships

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

## Architecture (Refactored)

### Entry Point
- `src/index.ts` - Main Cloudflare Worker fetch handler (CLEANED: 704 lines → ~140 lines)
  - Receives webhooks from Waha at `/event` endpoint
  - Routes commands to command handlers
  - Handles events (group join, participants update)
  - Uses centralized command registry pattern

### Environment & Configuration
- **Secrets** (stored in Cloudflare Secrets Store, accessed via bindings):
  - `api_key` - Waha API key
  - `base_url_name` - Waha base URL
  - `session_name` - WhatsApp session name
  - `openrouter_key` - OpenRouter API key for AI features

- **Access Control**:
  - `src/config/env.ts` defines allowed `GroupIds` and `PersonalIds`
  - Bot only responds to messages from configured groups/personal contacts

### Command Handlers (NEW)

All bot commands are now organized in `/src/commands/`:

```
src/commands/
├── index.ts              # Command registry & router types
├── registry.ts           # Central command registration
└── handlers/
    ├── help.ts           # /help
    ├── tagall.ts         # /tagall
    ├── pantun.ts         # /pantun
    ├── doaharian.ts      # /doaharian
    ├── bitcoin.ts        # /bitcoin
    ├── math.ts           # /math
    ├── dev.ts            # /dev
    ├── kick.ts           # /kick (admin only)
    ├── add.ts            # /add (admin only)
    ├── closegroup.ts     # /closegroup (admin only)
    ├── opengroup.ts      # /opengroup (admin only)
    ├── debugadmin.ts     # /debugadmin
    └── ai.ts             # /ai <prompt>
```

**Command Pattern:**
```typescript
// Each handler follows this pattern:
export default async (client: WahaChatClient, context: CommandContext) => {
  // Command logic here
  return new Response(JSON.stringify({ status: '...' }), { status: 200 });
};
```

### Services Layer (NEW)

Business logic is now organized in `/src/services/`:

```
src/services/
├── GroupAdminService.ts       # Admin checking & role validation
├── GroupMemberService.ts      # Kick/add member operations
├── GroupSettingsService.ts    # Group open/close settings
└── GroupParticipantService.ts # Participant fetching & mention all
```

**Benefits:**
- Separation of concerns
- Easier testing
- Reusable across commands
- Clear single responsibility

### WhatsApp Integration (Waha API)

- **Configuration**: `src/config/waha.ts` provides `WahaConfigManager` class and helper functions
- **Chat Client**: `src/functions/lib/chatting.ts` provides `WahaChatClient` class for all messaging operations
- **Group Utilities**: `src/functions/groupUtils.ts` now acts as a facade that delegates to services

### Event Handlers

Event handlers are located in `src/handler/`:
- `src/handler/in-group.ts` - Handles `group.v2.join` events, inserts group/participant data to database
- `src/handler/welcoming.ts` - Sends welcome messages to new group members (for `group.v2.participants` events)

**Note:** Welcome message handling for `group.v2.participants` events is now in `index.ts` for consistency.

### Type System (REFACTORED)

- **Consolidated Types**: All types now in `src/types.ts` (single source of truth)
- **Removed Duplicates**: Eliminated duplicate type definitions across files
- **Key Changes:**
  - `MathQuestion` - unified definition (was duplicated in `types.ts` and `mathQuiz.ts`)
  - `SendMessageOptions` - merged from `SendTextRequest` and `SendMessageOptions`
  - `WorkerEnv` and `WahaEnv` - kept separate for clarity

## Key Patterns

### Command Routing Pattern

Instead of if-else chains in `index.ts`, commands are now registered centrally:

```typescript
// In commands/registry.ts
registerCommand('/help', { handler: helpHandler, description: 'Show all commands' });
registerCommand('/tagall', { handler: tagallHandler, description: 'Mention all members' });
// ... etc

// In index.ts
const parsed = parseCommand(text);
if (parsed) {
  const [command] = parsed;
  const commandDef = getCommand(command);
  if (commandDef) {
    return await commandDef.handler(client, context);
  }
}
```

### WhatsApp ID Formats
- Personal chats: `{number}@c.us` (e.g., `6281234567890@c.us`)
- Group chats: `{id}@g.us` (e.g., `120363399604541928@g.us`)
- Waha API sometimes returns `@s.whatsapp.net` - normalize to `@c.us` for consistency

### Service Pattern

Business logic is encapsulated in service classes:

```typescript
// Example: Using GroupAdminService
const adminService = new GroupAdminService(baseUrl, session, apiKey);
const isAdmin = await adminService.isAdmin(groupId, userId);

// Example: Using GroupMemberService
const memberService = new GroupMemberService(baseUrl, session, apiKey);
await memberService.kickMember(groupId, participantId);
```

### Sending Messages (WahaChatClient)

All message sends go through `WahaChatClient`:

```typescript
const client = new WahaChatClient(config);

// Simple text
await client.sendText({ chatId, text, reply_to, mentions });

// To personal/group
await client.sendToPerson(phoneNumber, message);
await client.sendToGroup(groupId, message, { reply_to, mentions });

// Media
await client.sendImage({ chatId, url, caption });
await client.sendFile({ chatId, url, filename });
await client.sendAudio(chatId, audioUrl);
await client.sendVideo({ chatId, url, caption });
await client.sendList({ chatId, title, button, sections });
```

## Refactoring Summary

### Major Improvements

1. **Reduced index.ts**: 704 lines → ~140 lines (80% reduction)
2. **Extracted Commands**: All command handlers moved to `/src/commands/`
3. **Service Layer**: Business logic moved to `/src/services/`
4. **Consolidated Types**: Eliminated duplicate type definitions
5. **Cleaner Imports**: Centralized exports in index files

### Before vs After

**Before:**
```
index.ts (704 lines)
├── All command logic mixed together
├── Repeated fetch API calls
├── No clear separation of concerns
└── Hard to maintain and extend

groupUtils.ts (585 lines)
├── Mixed responsibilities
├── Duplicate code
└── Complex admin checking logic
```

**After:**
```
index.ts (~140 lines)
├── Clean command routing
├── Event handling
└── Delegates to handlers/services

commands/ (modular)
├── Each command in separate file
├── Clear single responsibility
└── Easy to add new commands

services/ (reusable)
├── GroupAdminService
├── GroupMemberService
├── GroupSettingsService
└── GroupParticipantService
```

## File Structure Notes

- TypeScript path alias `@/*` maps to `src/*`
- Static data files in `src/data/` (pantun, doa harian, etc.)
- Database schema in `src/db/schema.ts`
- Migrations generated to `drizzle/` directory
- Use `.dev.vars` for local environment variables (not in git)

## Related Documentation

### Feature Specifications (_docs/project-features.md)

The feature matrix document provides a comprehensive overview of all bot capabilities organized by category:

**Implemented Features:**
- Group Management: Tag All, Welcome Messages, Group Join Handling
- Content Moderation: Toxic Word Detection
- Educational Tools: AI Assistant (with database context)
- Utility Commands: Greetings, Pantun, Daily Prayers, Bitcoin Price, Developer Info, Help
- Admin Tools: Kick, Add Members, Close/Open Groups

**Planned Features:**
- Social Media Downloaders (Instagram, TikTok, YouTube, Facebook)
- Analytics: Chat Activity Tracking
- Gamification: Quiz & Trivia Games
- Database: Owner Data Collection
- Educational: Math Quiz (currently has errors)

Each feature includes:
- Status indicator (✅ Implemented / ⏳ Planned)
- Access level (Admin, Member, or permanent)
- Brief description of functionality

### Project Structure (_docs/project-sctructure.md)

The structure document contains:
- Complete directory tree visualization
- Detailed module-by-module breakdown:
  - `/src/config/` - Configuration and environment management
  - `/src/db/` - Database layer with Drizzle ORM
  - `/src/functions/` - Core bot functionality
  - `/src/handler/` - Event handlers for WhatsApp events
  - `/src/data/` - Static data files
  - `/src/commands/` - Command handlers (NEW)
  - `/src/services/` - Business logic services (NEW)
- Entry point explanation (`src/index.ts`)
- Configuration file details (package.json, wrangler.jsonc, tsconfig.json)
- Architectural patterns:
  - Service layer organization
  - Data flow diagram
  - Separation of concerns

Reference this document when:
- Adding new features (know where to place code)
- Understanding file organization
- Tracing code execution flow
- Locating specific functionality

## Adding New Commands

To add a new command:

1. **Create handler file** in `/src/commands/handlers/`:
```typescript
// src/commands/handlers/mycommand.ts
import type { WahaChatClient } from '../../functions/lib/chatting';
import type { CommandContext, CommandHandler } from '../index';

const handler: CommandHandler = async (client: WahaChatClient, context: CommandContext) => {
  const { chatId, replyTo } = context;

  // Your command logic here
  await client.sendText({ chatId, text: 'Response', reply_to: replyTo });

  return new Response(JSON.stringify({ status: 'mycommand sent' }), { status: 200 });
};

export default handler;
```

2. **Register command** in `/src/commands/registry.ts`:
```typescript
import mycommandHandler from './handlers/mycommand';

registerCommand('/mycommand', { handler: mycommandHandler, description: 'My command' });
```

That's it! The command routing system will automatically handle it.

## Best Practices

1. **Use Services**: Put reusable business logic in `/src/services/`
2. **Type Safety**: Use types from `src/types.ts` (don't redefine)
3. **Error Handling**: Return proper HTTP status codes in command handlers
4. **Clean Code**: Keep handlers focused on single responsibility
5. **Async/Await**: Always use async/await for clarity
6. **Comments**: Document complex logic, but avoid obvious comments

## Migration Notes

### Legacy Functions

Some functions are marked with `@deprecated` but kept for backward compatibility:
- `mentionAllLegacy` - Use `mentionAll` with `WahaChatClient` instead
- `handleKickCommandLegacy` - Use command handler pattern instead
- `handleAddCommandLegacy` - Use command handler pattern instead

These will be removed in future versions after migration is complete.
