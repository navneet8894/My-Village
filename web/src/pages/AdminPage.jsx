import { Children, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import VillageMap from '../components/VillageMap';
import {
  useAdminStatsQuery, useAdminUsersQuery, useGetEventsQuery, useGetNewsQuery,
  useGetInvitationsQuery, useGetMapConfigQuery, useAdminPostAnnouncementMutation,
  useAdminEmergencyMutation,
} from '../app/apiSlice';

const iconPaths = {
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87',
  family: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
  plus: 'M12 5v14M5 12h14', megaphone: 'm3 11 18-5v12L3 14v-3Zm6 5 2 5H7l-2-6',
  arrow: 'M5 12h14m-6-6 6 6-6 6', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
};
function Icon({ name, className = 'h-5 w-5' }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name]} /></svg>; }
const panel = 'admin-panel rounded-xl border border-slate-200 bg-white shadow-sm dark:border-line dark:bg-card dark:text-text';

// Compatibility wrapper keeps this dense dashboard preview small while using the
// same MapLibre/OpenFreeMap renderer as the full user and admin village maps.
function LoadScript({ children }) { return children; }
function Marker() { return null; }
function GoogleMap({ center, children }) {
  const pins = Children.toArray(children).slice(1).map((child, index) => ({ _id: child.key || index, title: child.props?.title || 'Village event', location: child.props?.position }));
  return <VillageMap center={center} villageName="Village network" events={pins} height={250} zoom={5} />;
}

function Metric({ icon, color, value, title, note }) {
  const colors = { violet: 'from-violet-600 to-purple-500 shadow-violet-200', blue: 'from-blue-600 to-cyan-500 shadow-blue-200', green: 'from-emerald-600 to-green-500 shadow-green-200', orange: 'from-orange-500 to-amber-400 shadow-orange-200' };
  return <div className={`${panel} flex min-h-[104px] items-center gap-4 p-4`}><span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${colors[color]}`}><Icon name={icon} className="h-7 w-7" /></span><div><p className="text-2xl font-bold text-[#0b1739]">{value ?? '—'}</p><p className="text-sm font-medium text-slate-600">{title}</p><p className="mt-1 text-[11px] font-medium text-emerald-600">{note}</p></div></div>;
}

function SectionTitle({ children, to, action = 'View All' }) { return <div className="mb-3 flex items-center justify-between"><h2 className="font-bold text-[#0b1739] dark:text-text">{children}</h2>{to && <Link to={to} className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">{action}</Link>}</div>; }

export default function AdminPage() {
  const { data: stats } = useAdminStatsQuery(); const { data: users } = useAdminUsersQuery();
  const { data: events } = useGetEventsQuery(); const { data: news } = useGetNewsQuery();
  const { data: invitations } = useGetInvitationsQuery(); const { data: rawMapConfig } = useGetMapConfigQuery();
  const mapConfig = { ...(rawMapConfig || {}), googleMapsApiKey: 'openfreemap' };
  const [postAnnouncement, { isLoading: announcing }] = useAdminPostAnnouncementMutation();
  const [sendEmergency] = useAdminEmergencyMutation(); const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const upcoming = useMemo(() => (events || []).filter((e) => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3), [events]);
  const recentNews = (news || []).slice(0, 4); const recentInvites = (invitations || []).slice(0, 3);
  const center = mapConfig?.defaultCenter || { lat: 20.5937, lng: 78.9629 };
  const verifiedPercent = stats?.userCount ? Math.round((stats.verifiedCount / stats.userCount) * 100) : 0;
  const quick = [
    ['/dashboard/admin/events', 'violet', 'calendar', 'Add Village Function'], ['/dashboard/events', 'blue', 'plus', 'Add User Function'],
    ['announce', 'green', 'megaphone', 'Send Announcement'], ['/dashboard/news', 'orange', 'bell', 'Add Instant Update'], ['/dashboard/admin/users', 'pink', 'users', 'Manage Users'],
  ];
  const quickColors = { violet: 'bg-violet-100 text-violet-600', blue: 'bg-blue-100 text-blue-600', green: 'bg-emerald-100 text-emerald-600', orange: 'bg-orange-100 text-orange-600', pink: 'bg-pink-100 text-pink-600' };

  async function broadcast(e) { e.preventDefault(); try { await postAnnouncement(form).unwrap(); toast.success('Announcement sent'); setForm({ title: '', body: '' }); setShowAnnouncement(false); } catch (err) { toast.error(err?.data?.message || 'Failed'); } }
  return <div className="space-y-4">
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon="users" color="violet" value={stats?.userCount} title="Total Users" note={`${verifiedPercent}% verified users`} />
      <Metric icon="family" color="blue" value={stats?.totalMembers} title="Families" note="Members in family trees" />
      <Metric icon="calendar" color="green" value={stats?.eventCount} title="Village Functions" note={`${stats?.upcomingEventCount || 0} upcoming`} />
      <Metric icon="bell" color="orange" value={stats?.postCount} title="Instant Updates" note="Live community posts" />
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.05fr_1.35fr_.8fr]">
      <div className={`${panel} p-4`}><SectionTitle to="/dashboard/admin/events">Upcoming Village Functions</SectionTitle><div className="space-y-2">{upcoming.map((event) => <article key={event._id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 dark:border-slate-700"><div className="h-14 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100">{event.bannerUrl ? <img src={event.bannerUrl} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xl">🌿</span>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{event.title}</p><p className="mt-1 text-[11px] text-slate-500">📅 {new Date(event.date).toLocaleDateString('en-IN')} · {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p><p className="truncate text-[11px] text-slate-500">⌖ {event.place || 'Place not added'}</p></div><span className="rounded-md bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">Upcoming</span></article>)}{!upcoming.length && <p className="py-12 text-center text-sm text-slate-400">No upcoming functions</p>}</div></div>
      <div className={`${panel} p-4`}><SectionTitle to="/dashboard/map" action="View Full Map">Village Map</SectionTitle><div className="h-[250px] overflow-hidden rounded-xl bg-slate-100">{mapConfig?.googleMapsApiKey ? <LoadScript googleMapsApiKey={mapConfig.googleMapsApiKey}><GoogleMap mapContainerStyle={{ width: '100%', height: '250px' }} center={center} zoom={5} options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}><Marker position={center} />{(events || []).filter((e) => e.location?.lat && e.location?.lng).map((e) => <Marker key={e._id} position={e.location} title={e.title} />)}</GoogleMap></LoadScript> : <div className="relative grid h-full place-items-center overflow-hidden bg-[linear-gradient(30deg,#dbeafe_12%,transparent_12.5%,transparent_87%,#dbeafe_87.5%,#dbeafe),linear-gradient(150deg,#dbeafe_12%,transparent_12.5%,transparent_87%,#dbeafe_87.5%,#dbeafe)] bg-[length:60px_100px]"><div className="rounded-xl bg-white/90 p-4 text-center shadow-lg"><span className="text-3xl">📍</span><p className="mt-1 text-xs font-bold text-slate-700">Village Map</p><p className="text-[10px] text-slate-500">Configure Google Maps API key</p></div></div>}</div></div>
      <div className={`${panel} p-4`}><SectionTitle>Quick Actions</SectionTitle><div className="space-y-2">{quick.map(([to, color, icon, label]) => { const content = <><span className={`grid h-7 w-7 place-items-center rounded-full ${quickColors[color]}`}><Icon name={icon} className="h-4 w-4" /></span><span className="text-xs font-medium text-slate-700">{label}</span></>; return to === 'announce' ? <button key={label} onClick={() => setShowAnnouncement(true)} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50">{content}</button> : <Link key={label} to={to} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 hover:bg-slate-50">{content}</Link>; })}</div></div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.05fr_1.35fr_.8fr]">
      <div className={`${panel} p-4`}><SectionTitle to="/dashboard/news">Recent Instant Updates</SectionTitle><div className="divide-y divide-slate-100">{recentNews.map((item) => <div key={item._id} className="flex items-center gap-3 py-2.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{item.userId?.name?.charAt(0) || '?'}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-800">{item.userId?.name || 'Villager'} <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">{item.kind}</span></p><p className="truncate text-[10px] text-slate-500">{item.text || 'Shared media'} · {new Date(item.createdAt).toLocaleString('en-IN')}</p></div>{item.kind === 'photo' && item.mediaUrl && <img src={item.mediaUrl} className="h-10 w-12 rounded object-cover" alt="" />}</div>)}{!recentNews.length && <p className="py-10 text-center text-sm text-slate-400">No updates yet</p>}</div></div>
      <div className={`${panel} p-4`}><SectionTitle to="/dashboard/admin/users" action="View Details">User Analytics</SectionTitle><p className="text-xs text-slate-500">Account overview</p><div className="mt-6 flex h-32 items-end gap-2">{[28, 45, 34, 64, 48, 72, 58, 82, 68, 90, 76, Math.max(20, verifiedPercent)].map((height, index) => <div key={index} className="group flex flex-1 flex-col justify-end"><div style={{ height: `${height}%` }} className="rounded-t bg-gradient-to-t from-blue-600 to-cyan-400 opacity-80 transition group-hover:opacity-100" /></div>)}</div><div className="mt-2 flex justify-between text-[9px] text-slate-400"><span>Registered</span><span>Current status</span></div><div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-4 text-center dark:divide-slate-700 dark:border-slate-800"><div><b>{stats?.userCount || 0}</b><p className="text-[10px] text-slate-500">Total</p></div><div><b>{stats?.verifiedCount || 0}</b><p className="text-[10px] text-slate-500">Verified</p></div><div><b>{stats?.bannedCount || 0}</b><p className="text-[10px] text-slate-500">Banned</p></div></div></div>
      <div className={`${panel} p-4`}><SectionTitle to="/dashboard/invitations">Recent Invitations</SectionTitle><div className="space-y-2">{recentInvites.map((inv) => <article key={inv._id} className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700"><div className="flex gap-2"><span className="grid h-8 w-8 place-items-center rounded bg-rose-50">🎁</span><div className="min-w-0"><p className="truncate text-xs font-bold">{inv.title}</p><p className="text-[10px] text-slate-500">by {inv.userId?.name || 'Villager'}</p><p className="mt-1 text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</p></div></div></article>)}{!recentInvites.length && <p className="py-10 text-center text-sm text-slate-400">No invitations yet</p>}</div></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className={`${panel} flex items-center gap-3 p-4`}><span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="shield" /></span><div><p className="font-bold text-slate-800">System Overview</p><p className="text-[11px] text-emerald-600">All systems are running smoothly</p></div></div><div className={`${panel} p-4`}><p className="text-xs text-slate-500">Verified Accounts</p><p className="mt-1 text-xl font-bold text-slate-800">{verifiedPercent}%</p></div><div className={`${panel} p-4`}><p className="text-xs text-slate-500">Connected Villages</p><p className="mt-1 text-xl font-bold text-slate-800">{stats?.villageCount || 0}</p></div><button onClick={async () => { if (!confirm('Send a system test alert?')) return; try { await sendEmergency({ title: 'System alert', body: 'This is a system test notification.' }).unwrap(); toast.success('Test alert sent'); } catch { toast.error('Could not send alert'); } }} className={`${panel} flex items-center justify-between p-4 text-left hover:border-blue-300`}><div><p className="text-xs text-slate-500">Notification System</p><p className="mt-1 font-bold text-slate-800">Send test alert</p></div><Icon name="arrow" className="h-5 w-5 text-blue-600" /></button></section>

    {showAnnouncement && <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAnnouncement(false); }}><form onSubmit={broadcast} className={`${panel} w-full max-w-md p-6`}><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Send Announcement</h2><button type="button" onClick={() => setShowAnnouncement(false)} className="text-xl text-slate-400">×</button></div><input required className="theme-input mt-5" placeholder="Announcement title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><textarea required rows={4} className="theme-input mt-3" placeholder="Write your message..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /><button disabled={announcing} className="theme-button-primary mt-4 w-full">{announcing ? 'Sending...' : 'Broadcast Now'}</button></form></div>}
  </div>;
}
