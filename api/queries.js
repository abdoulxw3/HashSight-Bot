import db from '../bot/db.js';

const now      = () => Math.floor(Date.now() / 1000);
const weeksAgo = (n) => now() - n * 7 * 24 * 3600;
const daysAgo  = (n) => now() - n * 24 * 3600;

export function msgVolume() {
  const week      = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > $t AND is_bot=0`).get({ $t: weeksAgo(1) }).n;
  const month     = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > $t AND is_bot=0`).get({ $t: daysAgo(30) }).n;
  const fourWeeks = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > $t AND is_bot=0`).get({ $t: weeksAgo(4) }).n;
  const annual    = db.prepare(`SELECT COUNT(*) as n FROM messages WHERE timestamp > $t AND is_bot=0`).get({ $t: weeksAgo(52) }).n;
  return { week, month, weekAvg4: Math.round(fourWeeks / 4), weekAvg52: Math.round(annual / 52) };
}

export function activeContributors() {
  return {
    week:  db.prepare(`SELECT COUNT(DISTINCT user_id) as n FROM messages WHERE timestamp > $t AND is_bot=0`).get({ $t: weeksAgo(1) }).n,
    month: db.prepare(`SELECT COUNT(DISTINCT user_id) as n FROM messages WHERE timestamp > $t AND is_bot=0`).get({ $t: daysAgo(30) }).n,
  };
}

export function memberGrowth() {
  const jw = db.prepare(`SELECT COUNT(*) as n FROM member_events WHERE event='join'  AND timestamp > $t`).get({ $t: weeksAgo(1) }).n;
  const lw = db.prepare(`SELECT COUNT(*) as n FROM member_events WHERE event='leave' AND timestamp > $t`).get({ $t: weeksAgo(1) }).n;
  const jm = db.prepare(`SELECT COUNT(*) as n FROM member_events WHERE event='join'  AND timestamp > $t`).get({ $t: daysAgo(30) }).n;
  const lm = db.prepare(`SELECT COUNT(*) as n FROM member_events WHERE event='leave' AND timestamp > $t`).get({ $t: daysAgo(30) }).n;
  return {
    week:  { joins: jw, leaves: lw, net: jw - lw },
    month: { joins: jm, leaves: lm, net: jm - lm },
  };
}

export function topChannels(limit = 8) {
  return db.prepare(`
    SELECT channel_name, COUNT(*) as msg_count
    FROM messages WHERE timestamp > $t AND is_bot=0 AND channel_name IS NOT NULL
    GROUP BY channel_id ORDER BY msg_count DESC LIMIT $limit
  `).all({ $t: weeksAgo(1), $limit: limit });
}

export function modActions() {
  return {
    week:  db.prepare(`SELECT action, COUNT(*) as n FROM mod_actions WHERE timestamp > $t GROUP BY action ORDER BY n DESC`).all({ $t: weeksAgo(1) }),
    month: db.prepare(`SELECT COUNT(*) as n FROM mod_actions WHERE timestamp > $t`).get({ $t: daysAgo(30) }).n,
  };
}

export function dailyTrend() {
  return db.prepare(`
    SELECT date(timestamp, 'unixepoch') as day, COUNT(*) as msgs, COUNT(DISTINCT user_id) as users
    FROM messages WHERE timestamp > $t AND is_bot=0
    GROUP BY day ORDER BY day ASC
  `).all({ $t: daysAgo(14) });
}

export function recentFeed(limit = 50) {
  return db.prepare(`
    SELECT username, channel_name, content, timestamp
    FROM messages WHERE is_bot=0 AND content IS NOT NULL
    ORDER BY timestamp DESC LIMIT $limit
  `).all({ $limit: limit });
}
