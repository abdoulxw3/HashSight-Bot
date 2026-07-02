import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/metrics.db');
mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id           TEXT PRIMARY KEY,
    channel_id   TEXT NOT NULL,
    channel_name TEXT,
    user_id      TEXT NOT NULL,
    username     TEXT,
    content      TEXT,
    timestamp    INTEGER NOT NULL,
    is_bot       INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS member_events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   TEXT NOT NULL,
    username  TEXT,
    event     TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS mod_actions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    executor_id TEXT,
    executor    TEXT,
    target_id   TEXT,
    target      TEXT,
    action      TEXT NOT NULL,
    reason      TEXT,
    timestamp   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_msg_ts     ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_msg_user   ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_member_ts  ON member_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_mod_ts     ON mod_actions(timestamp);
`);

const insertMessage = db.prepare(`
  INSERT OR IGNORE INTO messages (id, channel_id, channel_name, user_id, username, content, timestamp, is_bot)
  VALUES ($id, $channel_id, $channel_name, $user_id, $username, $content, $timestamp, $is_bot)
`);
const insertMemberEvent = db.prepare(`
  INSERT INTO member_events (user_id, username, event, timestamp)
  VALUES ($user_id, $username, $event, $timestamp)
`);
const insertModAction = db.prepare(`
  INSERT INTO mod_actions (executor_id, executor, target_id, target, action, reason, timestamp)
  VALUES ($executor_id, $executor, $target_id, $target, $action, $reason, $timestamp)
`);

export function logMessage(msg) {
  insertMessage.run({
    $id: msg.id,
    $channel_id: msg.channelId,
    $channel_name: msg.channel?.name ?? null,
    $user_id: msg.author.id,
    $username: msg.author.username,
    $content: msg.content ? msg.content.slice(0, 300) : null,
    $timestamp: Math.floor(msg.createdTimestamp / 1000),
    $is_bot: msg.author.bot ? 1 : 0,
  });
}
export function logMemberEvent(member, event) {
  insertMemberEvent.run({
    $user_id: member.id,
    $username: member.user?.username ?? 'unknown',
    $event: event,
    $timestamp: Math.floor(Date.now() / 1000),
  });
}
export function logModAction(entry) {
  insertModAction.run({
    $executor_id: entry.executor?.id ?? null,
    $executor: entry.executor?.username ?? null,
    $target_id: entry.target?.id ?? null,
    $target: entry.target?.username ?? null,
    $action: String(entry.action),
    $reason: entry.reason ?? null,
    $timestamp: Math.floor(entry.createdTimestamp / 1000),
  });
}
export default db;

// ── Tickets (forum channel posts) ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    channel_name TEXT,
    opener_id   TEXT,
    opener_name TEXT,
    closer_id   TEXT,
    closer_name TEXT,
    status      TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
    opened_at   INTEGER NOT NULL,
    closed_at   INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_ticket_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_ticket_opened ON tickets(opened_at);
`);

const insertTicket = db.prepare(`
  INSERT OR IGNORE INTO tickets (id, title, channel_name, opener_id, opener_name, status, opened_at)
  VALUES ($id, $title, $channel_name, $opener_id, $opener_name, 'open', $opened_at)
`);

const closeTicket = db.prepare(`
  UPDATE tickets SET status='closed', closer_id=$closer_id, closer_name=$closer_name, closed_at=$closed_at
  WHERE id=$id
`);

export function logTicketOpen(thread) {
  insertTicket.run({
    $id: thread.id,
    $title: thread.name ?? 'Untitled',
    $channel_name: thread.parent?.name ?? 'unknown',
    $opener_id: thread.ownerId ?? 'unknown',
    $opener_name: thread.ownerId ?? 'unknown',
    $opened_at: Math.floor(thread.createdTimestamp / 1000),
  });
}

export function logTicketClose(threadId, closer) {
  closeTicket.run({
    $id: threadId,
    $closer_id: closer?.id ?? 'unknown',
    $closer_name: closer?.username ?? 'unknown',
    $closed_at: Math.floor(Date.now() / 1000),
  });
}
