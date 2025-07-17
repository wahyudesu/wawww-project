
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { group, participant_group } from '../db/schema';

// env: { HYPERDRIVE: { connectionString: string } }
export async function handleJoinGroupEvent(event: any, env: any) {
  // Robustly extract group info from event
  const groupData = event?.payload?.group;
  if (!groupData) {
    console.error('No group data in event:', event);
    return;
  }
  const id = groupData.id;
  const subject = groupData.subject;
  const participants = Array.isArray(groupData.participants) ? groupData.participants : [];
  if (!id || !subject || participants.length === 0) {
    console.error('Missing id, subject, or participants:', { id, subject, participants });
    return;
  }

  console.log(`Handling join group event for group ID: ${id}, subject: ${subject}, participants count: ${participants.length}`);

  const sql = postgres(env.HYPERDRIVE.connectionString, { max: 5, fetch_types: false });
  const db = drizzle(sql);
  try {
    // Insert group (id, name)
    try {
      await db.insert(group).values({
        id,
        name: subject,
      }).onConflictDoNothing();
    } catch (err) {
      console.error('Failed to insert group:', err);
    }

    // Insert participants
    for (const p of participants) {
      // Be robust: WhatsApp id bisa @c.us atau @s.whatsapp.net, role bisa null
      if (!p?.id) continue;
      const role = p.role || (typeof p.admin === 'string' ? p.admin : 'participant');
      try {
        await db.insert(participant_group).values({
          id: p.id,
          role: role,
          group_id: id,
        }).onConflictDoNothing();
      } catch (err) {
        console.error('Failed to insert participant:', p, err);
      }
    }
  } finally {
    await sql.end();
  }
}
