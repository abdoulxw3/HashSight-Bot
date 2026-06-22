import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const fmt = (n) => n?.toLocaleString() ?? '—';
const ago = (unix) => {
  const d = Math.floor(Date.now() / 1000) - unix;
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};
const initial = (n) => (n?.[0] ?? '?').toUpperCase();
const actionClass = (a) => {
  const s = String(a).toLowerCase();
  if (s.includes('ban'))     return 'action-ban';
  if (s.includes('kick'))    return 'action-kick';
  if (s.includes('message')) return 'action-msg';
  if (s.includes('update'))  return 'action-timeout';
  return 'action-other';
};
const actionLabel = (a) => ({ 20:'Kick', 22:'Ban', 23:'Unban', 24:'Timeout', 72:'Msg Delete', 73:'Bulk Delete' }[a] ?? `Action ${a}`);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#16162a', border:'1px solid rgba(130,89,239,0.3)', borderRadius:8, padding:'10px 14px' }}>
      <p style={{ color:'#7b849a', fontSize:11, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontSize:13, fontWeight:600 }}>{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function App() {
  const [summary, setSummary] = useState(null);
  const [trend,   setTrend]   = useState([]);
  const [feed,    setFeed]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, t, f] = await Promise.all([
        fetch('/api/summary').then(r => r.json()),
        fetch('/api/trend').then(r => r.json()),
        fetch('/api/feed').then(r => r.json()),
      ]);
      setSummary(s); setTrend(t); setFeed(f);
      setUpdated(new Date().toLocaleTimeString()); setError(null);
    } catch { setError('Cannot reach API — make sure npm run api is running.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  if (loading) return <div className="loading"><div className="spinner"/><p>Loading HashSight...</p></div>;
  if (error)   return <div className="error">⚠ {error}</div>;

  const { messages, contributors, growth, topChannels, moderation } = summary;
  const delta = messages.weekAvg4 ? Math.round(((messages.week - messages.weekAvg4) / messages.weekAvg4) * 100) : 0;
  const growthData = [
    { name:'This week',  Joins: growth.week.joins,  Leaves: growth.week.leaves },
    { name:'This month', Joins: growth.month.joins, Leaves: growth.month.leaves },
  ];

  return (
    <div className="app">

      <header className="header">
        <div className="header-left">
          <svg width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" rx="8" fill="rgba(130,89,239,0.15)" stroke="#8259EF" strokeWidth="1"/><text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#8259EF" fontSize="16" fontWeight="700">H</text></svg>
          <h1>Hash<span>Sight</span></h1>
          <div className="badge"><span className="dot"/>Live</div>
        </div>
        <span className="last-updated">Updated {updated}</span>
      </header>

      <p className="section-title">Overview</p>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">💬</span>
          <div className="stat-label">Messages this week</div>
          <div className="stat-value">{fmt(messages.week)}</div>
          <div className="stat-sub"><span className={delta >= 0 ? 'up':'down'}>{delta >= 0 ? '▲':'▼'} {Math.abs(delta)}%</span> vs 4-week avg</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-label">Active contributors</div>
          <div className="stat-value">{fmt(contributors.week)}</div>
          <div className="stat-sub">{fmt(contributors.month)} this month</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📈</span>
          <div className="stat-label">Net member growth</div>
          <div className="stat-value" style={{ color: growth.week.net >= 0 ? 'var(--green)':'var(--red)' }}>
            {growth.week.net >= 0 ? '+':''}{fmt(growth.week.net)}
          </div>
          <div className="stat-sub">{fmt(growth.week.joins)} joined · {fmt(growth.week.leaves)} left</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🛡️</span>
          <div className="stat-label">Mod actions this week</div>
          <div className="stat-value">{fmt(moderation.week?.length ?? 0)}</div>
          <div className="stat-sub">{fmt(moderation.month)} this month</div>
        </div>
      </div>

      <p className="section-title">Benchmarks</p>
      <div className="benchmark">
        <div className="bench-item"><span className="bench-label">This week</span><span className="bench-value">{fmt(messages.week)}</span><span className="bench-sub">messages</span></div>
        <div className="bench-divider"/>
        <div className="bench-item"><span className="bench-label">4-week avg</span><span className="bench-value">{fmt(messages.weekAvg4)}</span><span className="bench-sub">per week</span></div>
        <div className="bench-divider"/>
        <div className="bench-item"><span className="bench-label">Annual avg</span><span className="bench-value">{fmt(messages.weekAvg52)}</span><span className="bench-sub">per week</span></div>
        <div className="bench-divider"/>
        <div className="bench-item"><span className="bench-label">Monthly total</span><span className="bench-value">{fmt(messages.month)}</span><span className="bench-sub">messages</span></div>
      </div>

      <p className="section-title">Activity</p>
      <div className="charts-grid">
        <div className="chart-card wide">
          <div className="chart-title">Daily Trend — Last 14 Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8259EF" stopOpacity={0.3}/><stop offset="95%" stopColor="#8259EF" stopOpacity={0}/></linearGradient>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,89,239,0.1)"/>
              <XAxis dataKey="day" tick={{ fill:'#7b849a', fontSize:11 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill:'#7b849a', fontSize:11 }} tickLine={false} axisLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Legend wrapperStyle={{ fontSize:12, color:'#7b849a' }}/>
              <Area type="monotone" dataKey="msgs"  name="Messages" stroke="#8259EF" fill="url(#gM)" strokeWidth={2} dot={false}/>
              <Area type="monotone" dataKey="users" name="Users"    stroke="#60a5fa" fill="url(#gU)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Top Channels This Week</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topChannels} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,89,239,0.1)" horizontal={false}/>
              <XAxis type="number" tick={{ fill:'#7b849a', fontSize:11 }} tickLine={false} axisLine={false}/>
              <YAxis type="category" dataKey="channel_name" tick={{ fill:'#7b849a', fontSize:11 }} tickLine={false} axisLine={false} width={110}/>
              <Tooltip content={<Tip/>}/>
              <Bar dataKey="msg_count" name="Messages" fill="#8259EF" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Member Growth</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,89,239,0.1)"/>
              <XAxis dataKey="name" tick={{ fill:'#7b849a', fontSize:11 }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fill:'#7b849a', fontSize:11 }} tickLine={false} axisLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Legend wrapperStyle={{ fontSize:12, color:'#7b849a' }}/>
              <Bar dataKey="Joins"  fill="#22c55e" radius={[4,4,0,0]}/>
              <Bar dataKey="Leaves" fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="section-title">Moderation Log</p>
      <div className="mod-card">
        <div className="chart-title">Actions This Week</div>
        {!moderation.week?.length
          ? <p style={{ color:'var(--muted)', fontSize:13 }}>No mod actions this week 🎉</p>
          : <table>
              <thead><tr><th>Action</th><th>Count</th></tr></thead>
              <tbody>
                {moderation.week.map((r,i) => (
                  <tr key={i}>
                    <td><span className={`action-badge ${actionClass(r.action)}`}>{actionLabel(r.action)}</span></td>
                    <td style={{ fontWeight:600 }}>{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      <p className="section-title">Raw Activity Feed</p>
      <div className="feed-card">
        <div className="chart-title">Recent Messages</div>
        <div className="feed-list">
          {!feed.length
            ? <p style={{ color:'var(--muted)', fontSize:13 }}>No messages yet — start the bot first.</p>
            : feed.map((m,i) => (
              <div key={i} className="feed-item">
                <div className="feed-avatar">{initial(m.username)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="feed-meta">
                    <span className="feed-user">{m.username}</span>
                    <span className="feed-channel">#{m.channel_name}</span>
                    <span className="feed-time">{ago(m.timestamp)}</span>
                  </div>
                  <div className="feed-content">{m.content}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

    </div>
  );
}
