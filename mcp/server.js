import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';
import { msgVolume, activeContributors, memberGrowth, topChannels, modActions, dailyTrend, recentFeed, ticketStats, ticketList } from '../api/queries.js';

const app  = express();
const PORT = process.env.MCP_PORT || 3002;
app.use(express.json());

const server = new McpServer({ name: 'hashsight', version: '1.0.0' });

server.tool('get_weekly_summary', 'Full summary of Hedera Discord activity this week', {}, async () => {
  const data = { messages: msgVolume(), contributors: activeContributors(), growth: memberGrowth(), moderation: modActions(), tickets: ticketStats() };
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

server.tool('get_message_volume', 'Message counts with benchmark comparisons', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(msgVolume(), null, 2) }] };
});

server.tool('get_member_growth', 'Member joins, leaves and net growth', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(memberGrowth(), null, 2) }] };
});

server.tool('get_top_channels', 'Most active channels this week', { limit: z.number().min(1).max(20).optional() }, async ({ limit }) => {
  return { content: [{ type: 'text', text: JSON.stringify(topChannels(limit ?? 8), null, 2) }] };
});

server.tool('get_mod_actions', 'Moderation actions this week', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(modActions(), null, 2) }] };
});

server.tool('get_activity_trend', 'Daily message and user counts for last 14 days', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify(dailyTrend(), null, 2) }] };
});

server.tool('get_recent_feed', 'Most recent messages', { limit: z.number().min(1).max(100).optional() }, async ({ limit }) => {
  return { content: [{ type: 'text', text: JSON.stringify(recentFeed(limit ?? 50), null, 2) }] };
});

server.tool('get_tickets', 'Ticket stats and recent ticket list', {}, async () => {
  return { content: [{ type: 'text', text: JSON.stringify({ stats: ticketStats(), recent: ticketList(20) }, null, 2) }] };
});

server.tool('detect_anomalies', 'Detect unusual activity spikes or drops', {}, async () => {
  const messages = msgVolume();
  const growth   = memberGrowth();
  const mod      = modActions();
  const anomalies = [];

  if (messages.weekAvg4 > 0) {
    const delta = ((messages.week - messages.weekAvg4) / messages.weekAvg4) * 100;
    if (Math.abs(delta) > 50) anomalies.push({ type: delta > 0 ? 'message_spike' : 'message_drop', detail: `Messages ${Math.abs(Math.round(delta))}% ${delta > 0 ? 'above' : 'below'} 4-week avg`, severity: Math.abs(delta) > 80 ? 'high' : 'medium' });
  }
  if (growth.week.net < -10) anomalies.push({ type: 'member_loss', detail: `Net loss of ${growth.week.net} members this week`, severity: 'high' });
  const modCount = mod.week?.reduce((s, r) => s + r.n, 0) ?? 0;
  if (modCount > 10) anomalies.push({ type: 'high_moderation', detail: `${modCount} mod actions this week`, severity: modCount > 25 ? 'high' : 'medium' });

  return { content: [{ type: 'text', text: JSON.stringify({ anomalies_found: anomalies.length, anomalies: anomalies.length ? anomalies : ['No anomalies — activity within normal range'] }, null, 2) }] };
});

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp/health', (_, res) => res.json({ ok: true, tools: 9 }));
app.listen(PORT, () => console.log(`🤖 HashSight MCP running on port ${PORT}`));
