import { logMessage } from '../db.js';
export default function onMessageCreate(message) {
  if (message.guildId !== process.env.GUILD_ID) return;
  if (!message.author) return;
  logMessage(message);
}
