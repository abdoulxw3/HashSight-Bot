import { logMemberEvent } from '../db.js';
export default function onMemberAdd(member) {
  if (member.guild.id !== process.env.GUILD_ID) return;
  logMemberEvent(member, 'join');
  console.log(`📥 Member joined: ${member.user?.username}`);
}
