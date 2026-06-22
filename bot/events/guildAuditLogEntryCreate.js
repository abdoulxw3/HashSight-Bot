import { logModAction } from '../db.js';
import { AuditLogEvent } from 'discord.js';

const TRACKED = new Set([
  AuditLogEvent.MemberKick,
  AuditLogEvent.MemberBanAdd,
  AuditLogEvent.MemberBanRemove,
  AuditLogEvent.MemberUpdate,
  AuditLogEvent.MessageDelete,
  AuditLogEvent.MessageBulkDelete,
]);

export default function onAuditLog(entry, guild) {
  if (guild.id !== process.env.GUILD_ID) return;
  if (!TRACKED.has(entry.action)) return;
  logModAction(entry);
  console.log(`🛡️  Mod action logged: ${entry.action}`);
}
