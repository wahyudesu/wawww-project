// Script: scripts/ensure-groups.ts
// Usage: node -r ts-node/register scripts/ensure-groups.ts
// This script will insert GroupIds from src/config/env.ts into the database `group` table.

import { GroupIds } from '../src/config/env';
import postgres from 'postgres';

async function main() {
	const connString = process.env.HYPERDRIVE_CONNECTION_STRING || process.env.HYPERDRIVE_CONNECTIONSTRING || process.env.DATABASE_URL;
	if (!connString) {
		console.error('Database connection string not found in env (HYPERDRIVE_CONNECTION_STRING or DATABASE_URL). Aborting.');
		process.exit(1);
	}

	const sql = postgres(connString, { max: 5 });
	try {
		for (const gid of GroupIds) {
			await sql`INSERT INTO "group" (id, name, settings) VALUES (${gid}, ${'Imported ' + gid}, ${JSON.stringify({})}::jsonb) ON CONFLICT (id) DO NOTHING`;
			console.log('Ensured group', gid);
		}
	} finally {
		await sql.end();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
