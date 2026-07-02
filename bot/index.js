import { Client, GatewayIntentBits, Events } from 'discord.js';
import onMessageCreate from './events/messageCreate.js';
import onMemberAdd from './events/guildMemberAdd.js';
import onMemberRemove from './events/guildMemberRemove.js';
import onAuditLog from './events/guildAuditLogEntryCreate.js';
import onThreadCreate from './events/threadCreate.js';
import onThreadUpdate from './events/threadUpdate.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Bot ready — logged in as ${c.user.tag}`);
  console.log(`📊 Tracking guild: ${process.env.GUILD_ID}`);
});

client.on(Events.MessageCreate,              onMessageCreate);
client.on(Events.GuildMemberAdd,             onMemberAdd);
client.on(Events.GuildMemberRemove,          onMemberRemove);
client.on(Events.GuildAuditLogEntryCreate,   onAuditLog);
client.on(Events.ThreadCreate,               onThreadCreate);
client.on(Events.ThreadUpdate,               onThreadUpdate);
client.on(Events.Error, (err) => console.error('Discord client error:', err));

client.login(process.env.DISCORD_BOT_TOKEN);
