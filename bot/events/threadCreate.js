import { logTicketOpen } from '../db.js';
import { ChannelType } from 'discord.js';

export default async function onThreadCreate(thread, newlyCreated) {
  if (thread.guild?.id !== process.env.GUILD_ID) return;
  if (!newlyCreated) return;
  // Only track forum channel posts
  if (thread.parent?.type !== ChannelType.GuildForum) return;

  // Fetch starter message to resolve opener username
  try {
    const starterMsg = await thread.fetchStarterMessage().catch(() => null);
    if (starterMsg) thread.ownerId = starterMsg.author.id;
  } catch {}

  logTicketOpen(thread);
  console.log(`🎫 Ticket opened: "${thread.name}" by ${thread.ownerId}`);
}
