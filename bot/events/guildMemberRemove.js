import { logMemberEvent } from '../db.js';
export default function onMemberRemove(member) {
  if (member.guild.id !== process.env.GUILD_ID) return;
  logMemberEvent(member, 'leave');
  console.log(`📤 Member left: ${member.user?.username}`);
}
