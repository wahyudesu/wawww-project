
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { group, participant_group } from '../db/schema';

// env: { HYPERDRIVE: { connectionString: string } }
export async function handleJoinGroupEvent(event: any, env: any) {
  const { id, subject, participants } = event?.payload?.group || {};
  if (!id || !subject || !Array.isArray(participants)) return;

  const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5, fetch_types: false });
  const db = drizzle(sql);
  try {
    // Insert group (id, name)
    await db.insert(group).values({
      id,
      name: subject,
    }).onConflictDoNothing();

    // Insert participants
    for (const p of participants) {
      if (!p?.id || !p?.role) continue;
      await db.insert(participant_group).values({
        id: p.id,
        role: p.role,
        group_id: id,
      }).onConflictDoNothing();
    }
  } finally {
    await sql.end();
  }
}
