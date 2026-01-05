# Z0 WhatsApp Group Chatbot

WhatsApp group chatbot yang dibangun dengan Cloudflare Worker, terintegrasi dengan Waha (WhatsApp HTTP API). Bot ini menyediakan fitur moderasi otomatis, permainan, fitur Islam, dan asisten AI untuk grup WhatsApp.

## 🎯 Fitur Utama

### Group Management
- `/tagall` - Mention semua anggota grup (dengan filter)
- `/welcome` - Pesan selamat datang otomatis untuk anggota baru
- `/kick <number>` - Tambah anggota (admin only)
- `/add <numbers>` - Tambah anggota (admin only)
- `/closegroup` - Tutup grup (hanya admin) (admin only)
- `/opengroup` - Buka grup untuk semua anggota (admin only)

### AI & Utilities
- `/ai <prompt>` - Asisten AI menggunakan OpenRouter/Mistral
- `/pantun` - Pantun acak bahasa Indonesia
- `/doaharian` - Doa harian acak
- `/bitcoin` - Cek harga Bitcoin (USD/IDR)
- `/math` - Kuis matematika
- `/dev` - Info developer

### Moderation
- Deteksi kata toxic otomatis
- Filter pesan sebelum diproses

### Info
- `/help` - Daftar semua perintah
- `/debugadmin` - Debug status admin

## 🚀 Setup

### Prerequisites
- [Bun](https://bun.sh/) - JavaScript runtime
- [Cloudflare Workers](https://workers.cloudflare.com/) account
- [Waha](https://waha.devlike.pro/) instance untuk WhatsApp API
- PostgreSQL database (dengan Hyperdrive atau direct connection)

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd z0-project-latest
```

2. Install dependencies
```bash
bun install
```

3. Setup environment variables
Buat file `.dev.vars` untuk local development:
```bash
# Waha API Configuration
api_key=your_waha_api_key
base_url_name=https://your-waha-instance.com
session_name=your_session_name

# OpenRouter API (untuk fitur AI)
openrouter_key=your_openrouter_api_key

# Database (opsional, bisa pakai Hyperdrive)
DATABASE_URL=postgresql://user:password@host:port/database
```

4. Setup database
```bash
# Generate migrations
bun run generate

# Run migrations
bun run migrate

# Atau push schema langsung (untuk dev)
bun run push
```

## 📝 Development

### Commands

```bash
# Local development
bun run dev        # Start wrangler dev server

# Testing
bun run test       # Run tests (vitest)

# Database operations
bun run generate   # Generate migrations from schema
bun run migrate    # Apply migrations
bun run push       # Push schema directly (dev only)

# Deployment
bun run deploy     # Deploy ke Cloudflare Workers

# Type generation
bun run cf-typegen # Generate Cloudflare Worker types
```

### Configuration

#### Access Control
Edit `src/config/env.ts` untuk menambahkan grup dan kontak yang diizinkan:
```typescript
export const GroupIds = [
  '120363399604541928@g.us',
  // tambahkan ID grup lain
];

export const PersonalIds = [
  '6281234567890@c.us',
  // tambahkan ID personal lain
];
```

#### Cron Triggers
Edit `wrangler.jsonc` untuk mengatur jadwal cron:
```json
{
  "triggers": {
    "crons": [
      { "cron": "45 18 * * *", "path": "/cron" } // Daily 07:00 GMT+7
    ]
  }
}
```

## 🏗️ Architecture

### Entry Point
- `src/index.ts` - Main Cloudflare Worker handler, menerima webhook dari Waha di `/event`

### Project Structure
```
src/
├── config/           # Configuration & environment management
│   ├── env.ts        # Access control (GroupIds, PersonalIds)
│   └── waha.ts       # Waha API configuration
├── db/              # Database layer
│   └── schema.ts     # Drizzle ORM schema
├── functions/       # Core bot functionality
│   ├── groupUtils.ts     # Group utilities (tagall, kick, add, etc.)
│   ├── messageHandlers.ts # Command routing
│   ├── toxic-handler.ts   # Toxic word detection
│   ├── lib/              # Helper functions
│   └── services/         # Service layer
├── handler/         # Event handlers
│   ├── in-group.ts    # Handle group join events
│   └── welcoming.ts   # Welcome messages
├── data/            # Static data files
│   ├── pantun.json
│   └── doaharian.json
└── index.ts         # Main entry point
```

### Key Components

#### WhatsApp Integration
- **Waha API**: Semua pesan dikirim melalui Waha HTTP API
- **ID Formats**:
  - Personal: `{number}@c.us` (e.g., `6281234567890@c.us`)
  - Group: `{id}@g.us` (e.g., `120363399604541928@g.us`)

#### Database Schema
- `group` - Informasi grup
- `participant_group` - Anggota grup
- `group_whatsapp` - Metadata WhatsApp
- `user` - Data user
- `subscription` - Data subscription

#### Message Flow
1. Webhook diterima di `/event`
2. Cek access control (GroupIds/PersonalIds)
3. Deteksi toxic words
4. Parse command
5. Execute command logic
6. Send response via Waha API

## 📚 Documentation

- [AGENTS.md](./AGENTS.md) - Panduan untuk Claude Code agents
- [_docs/project-features.md](./_docs/project-features.md) - Matriks fitur lengkap
- [_docs/project-sctructure.md](./_docs/project-sctructure.md) - Struktur direktori detail

## 🔧 Troubleshooting

### Bot tidak merespon
1. Cek apakah Group ID terdaftar di `src/config/env.ts`
2. Verifikasi Waha API key di environment variables
3. Pastikan session Waha aktif

### Database connection error
1. Cek `DATABASE_URL` di `.dev.vars`
2. Pastikan PostgreSQL accessible dari Cloudflare Workers
3. Atau gunakan Hyperdrive untuk connection pooling

### Cron tidak jalan
1. Verifikasi cron expression di `wrangler.jsonc`
2. Cek logs di Cloudflare Workers dashboard
3. Pastikan path cron benar (`/cron`)

## 📝 License

[Your License Here]

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines first.

## 🔗 Links

- [Whiteboard & Docs](https://whimsical.com/overview-WMefErubCu4WLBYiLNkGEC)
- [Waha Documentation](https://waha.devlike.pro/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
