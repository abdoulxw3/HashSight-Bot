import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../data/metrics.db'));
db.pragma('journal_mode = WAL');

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
    event     TEXT NOT NULL CHECK(event IN ('join','leave')),
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
  CREATE INDEX IF NOT EXISTS idx_msg_ts      ON messages(timestamp);
  CREATE INDEX IF NOT EXISTS idx_msg_channel ON messages(channel_id);
  CREATE INDEX IF NOT EXISTS idx_msg_user    ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_member_ts   ON member_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_mod_ts      ON mod_actions(timestamp);
`);

const insertMessage = db.prepare(`
  INSERT OR IGNORE INTO messages (id, channel_id, channel_name, user_id, username, content, timestamp, is_bot)
  VALUES (@id, @channel_id, @channel_name, @user_id, @username, @content, @timestamp, @is_bot)
`);
const insertMemberEvent = db.prepare(`
  INSERT INTO member_events (user_id, username, event, timestamp)
  VALUES (@user_id, @username, @event, @timestamp)
`);
const insertModAction = db.prepare(`
  INSERT INTO mod_actions (executor_id, executor, target_id, target, action, reason, timestamp)
  VALUES (@executor_id, @executor, @target_id, @target, @action, @reason, @timestamp)
`);

export function logMessage(msg) {
  insertMessage.run({
    id: msg.id,
    channel_id: msg.channelId,
    channel_name: msg.channel?.name ?? null,
    user_id: msg.author.id,
    username: msg.author.username,
    content: msg.content ? msg.content.slice(0, 300) : null,
    timestamp: Math.floor(msg.createdTimestamp / 1000),
    is_bot: msg.author.bot ? 1 : 0,
  });
}
export function logMemberEvent(member, event) {
  insertMemberEvent.run({
    user_id: member.id,
    username: member.user?.username ?? 'unknown',
    event,
    timestamp: Math.floor(Date.now() / 1000),
  });
}
export function logModAction(entry) {
  insertModAction.run({
    executor_id: entry.executor?.id ?? null,
    executor: entry.executor?.username ?? null,
    target_id: entry.target?.id ?? null,
    target: entry.target?.username ?? null,
    action: entry.action,
    reason: entry.reason ?? null,
    timestamp: Math.floor(entry.createdTimestamp / 1000),
  });
}
export default db;
