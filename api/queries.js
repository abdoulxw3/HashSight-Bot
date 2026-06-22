import db from '../bot/db.js';

const now     = () => Math.floor(Date.now() / 1000);
const weeksAgo = (n) => now() - n * 7 * 24 * 3600;
const daysAgo  = (n) => now() - n * 24 * 3600;

export function msgVolume() {
  const week     = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > ? AND is_bot=0`).get(weeksAgo(1)).n;
  const month    = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > ? AND is_bot=0`).get(daysAgo(30)).n;
  const fourWeeks = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > ? AND is_bot=0`).get(weeksAgo(4)).n;
  const annual   = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > ? AND is_bot=0`).get(weeksAgo(52)).n;
  return { week, month, weekAvg4: Math.round(fourWeeks/4), weekAvg52: Math.round(annual/52) };
}

export function activeContributors() {
  return {
    week:  db.prepare(`SELECT COUNT(DISTINCT user_id) as n FROM messages WHERE timestamp > ? AND is_bot=0`).get(weeksAgo(1)).n,
    month: db.prepare(`SELECT COUNT(DISTINCT user_id) as n FROM messages WHERE timestamp > ? AND is_bot=0`).get(daysAgo(30)).n,
  };
}

export function memberGrowth() {
  const row = db.prepare(`
    SELECT
      SUM(CASE WHEN event='join'  AND timestamp > ? THEN 1 ELSE 0 END) as jw,
      SUM(CASE WHEN event='leave' AND timestamp > ? THEN 1 ELSE 0 END) as lw,
      SUM(CASE WHEN event='join'  AND timestamp > ? THEN 1 ELSE 0 END) as jm,
      SUM(CASE WHEN event='leave' AND timestamp > ? THEN 1 ELSE 0 END) as lm
    FROM member_events
  `).get(weeksAgo(1), weeksAgo(1), daysAgo(30), daysAgo(30));
  return {
    week:  { joins: row.jw??0, leaves: row.lw??0, net: (row.jw??0)-(row.lw??0) },
    month: { joins: row.jm??0, leaves: row.lm??0, net: (row.jm??0)-(row.lm??0) },
  };
}

export function topChannels(limit=8) {
  return db.prepare(`
    SELECT channel_name, COUNT(*) as msg_count
    FROM messages WHERE timestamp > ? AND is_bot=0 AND channel_name IS NOT NULL
    GROUP BY channel_id ORDER BY msg_count DESC LIMIT ?
  `).all(weeksAgo(1), limit);
}

export function modActions() {
  return {
    week:  db.prepare(`SELECT action, COUNT(*) as n FROM mod_actions WHERE timestamp > ? GROUP BY action ORDER BY n DESC`).all(weeksAgo(1)),
    month: db.prepare(`SELECT COUNT(*) as n FROM mod_actions WHERE timestamp > ?`).get(daysAgo(30)).n,
  };
}

export function dailyTrend() {
  return db.prepare(`
    SELECT date(timestamp,'unixepoch') as day, COUNT(*) as msgs, COUNT(DISTINCT user_id) as users
    FROM messages WHERE timestamp > ? AND is_bot=0
    GROUP BY day ORDER BY day ASC
  `).all(daysAgo(14));
}

export function peakHours() {
  return db.prepare(`
    SELECT strftime('%H',timestamp,'unixepoch') as hour, strftime('%w',timestamp,'unixepoch') as dow, COUNT(*) as msgs
    FROM messages WHERE timestamp > ? AND is_bot=0
    GROUP BY hour, dow ORDER BY hour, dow
  `).all(weeksAgo(4));
}

export function recentFeed(limit = 50) {
  return db.prepare(`
    SELECT username, channel_name, content, timestamp
    FROM messages
    WHERE is_bot = 0 AND content IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(limit);
}
