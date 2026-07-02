import { logTicketClose } from '../db.js';
import { ChannelType, AuditLogEvent } from 'discord.js';

export default async function onThreadUpdate(oldThread, newThread) {
  if (newThread.guild?.id !== process.env.GUILD_ID) return;
  if (newThread.parent?.type !== ChannelType.GuildForum) return;

  // Fire only when thread transitions to archived (closed)
  const justArchived = !oldThread.archived && newThread.archived;
  if (!justArchived) return;

  // Try to find who closed it from audit log
  let closer = null;
  try {
    const logs = await newThread.guild.fetchAuditLogs({
      type: AuditLogEvent.ThreadUpdate,
      limit: 5,
    });
    const entry = logs.entries.find(e => e.target?.id === newThread.id);
    if (entry) closer = entry.executor;
  } catch {}

  logTicketClose(newThread.id, closer);
  console.log(`🔒 Ticket closed: "${newThread.name}" by ${closer?.username ?? 'unknown'}`);
}
