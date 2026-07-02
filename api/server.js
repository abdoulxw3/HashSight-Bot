import express from 'express';
import cors from 'cors';
import {
  msgVolume, activeContributors, memberGrowth,
  topChannels, modActions, dailyTrend, recentFeed,
  ticketStats, ticketList, topClosers, topOpeners,
} from './queries.js';

const app  = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

app.get('/health',              (_, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/summary',         (_, res) => res.json({ messages: msgVolume(), contributors: activeContributors(), growth: memberGrowth(), topChannels: topChannels(), moderation: modActions(), tickets: ticketStats() }));
app.get('/api/messages',        (_, res) => res.json(msgVolume()));
app.get('/api/contributors',    (_, res) => res.json(activeContributors()));
app.get('/api/growth',          (_, res) => res.json(memberGrowth()));
app.get('/api/channels',        (_, res) => res.json(topChannels()));
app.get('/api/moderation',      (_, res) => res.json(modActions()));
app.get('/api/trend',           (_, res) => res.json(dailyTrend()));
app.get('/api/feed',            (_, res) => res.json(recentFeed()));
app.get('/api/tickets',         (_, res) => res.json(ticketStats()));
app.get('/api/tickets/list',    (_, res) => res.json(ticketList()));
app.get('/api/tickets/closers', (_, res) => res.json(topClosers()));
app.get('/api/tickets/openers', (_, res) => res.json(topOpeners()));

app.listen(PORT, () => console.log(`📡 API running on port ${PORT}`));
