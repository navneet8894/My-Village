import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetEventsQuery, useGetInvitationsQuery, useGetMyVillageQuery, useGetNewsQuery,
} from '../app/apiSlice';
import VillageSetupModal from '../components/VillageSetupModal';
import { Button } from '../shared/ui';

const icons = {
  family: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87',
  map: 'M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  event: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2Z',
  news: 'M5 3h14a2 2 0 0 1 2 2v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 4h8M8 11h8m-8 4h5',
  invite: 'M3 6h18v13H3V6Zm0 1 9 7 9-7',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42m11.32 0 1.42 1.42M4.92 4.92l1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
};
function Icon({ name, className = '' }) { return <svg className={className || 'h-5 w-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name]} /></svg>; }

const tiles = [
  { to: '/dashboard/family', icon: 'family', title: 'Family', desc: 'Tree & members', color: 'coral' },
  { to: '/dashboard/map', icon: 'map', title: 'Village Map', desc: 'Pins & landmarks', color: 'blue' },
  { to: '/dashboard/events', icon: 'event', title: 'Events', desc: 'Upcoming gatherings', color: 'green' },
  { to: '/dashboard/news', icon: 'news', title: 'Instant News', desc: 'Village broadcasts', color: 'pink' },
  { to: '/dashboard/invitations', icon: 'invite', title: 'Invitations', desc: 'Weddings & festivals', color: 'yellow' },
  { to: '/dashboard/notifications', icon: 'sun', title: 'Notifications', desc: 'Updates & reminders', color: 'orange' },
];

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: villageData, refetch } = useGetMyVillageQuery(undefined, { skip: user?.role === 'admin' });
  const { data: events = [] } = useGetEventsQuery();
  const { data: news = [] } = useGetNewsQuery();
  const { data: invitations = [] } = useGetInvitationsQuery();
  const village = villageData?.village;
  const members = villageData?.members || [];
  const hasVillage = user?.villageId || village;
  useEffect(() => { if (user?.role !== 'admin' && !hasVillage) setModalOpen(true); }, [user?.role, hasVillage]);

  if (user?.role === 'admin') return <div><h1 className="text-2xl font-bold">Hello, {user?.name}</h1><Link className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-white" to="/dashboard/admin">Go to admin dashboard</Link></div>;

  const firstName = user?.name?.split(' ')[0] || 'Villager';
  const villageName = village?.name || 'Your Village';
  const location = village ? [village.district, village.state, village.country].filter(Boolean).join(', ') : 'Add your village to see local updates';
  const recent = news.slice(0, 2);
  const stats = [
    { value: members.length || '—', title: 'Villagers', note: 'In your village', tone: 'coral' },
    { value: events.length, title: 'Upcoming Events', note: 'Community gatherings', tone: 'green' },
    { value: news.length, title: 'News Updates', note: `${recent.length} recent`, tone: 'orange' },
    { value: invitations.length, title: 'Invitations', note: 'From villagers', tone: 'yellow' },
  ];

  return <div className="village-dashboard">
    <section className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="village-display text-4xl text-[#30251f] dark:text-text">Hello, {firstName}</h1><p className="mt-2 text-[15px] text-[#81756d] dark:text-text-subtle">Welcome back. Here is what is happening in {villageName} today.</p></div>
      {!hasVillage && <Button onClick={() => setModalOpen(true)}>Add your village</Button>}
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => <div className="village-panel p-4 sm:p-5" key={s.title}><span className={`stat-bubble ${s.tone}`}>{s.value}</span><h2 className="mt-4 text-sm font-bold text-[#40332c] dark:text-text">{s.title}</h2><p className="mt-1 text-xs text-[#8c8079] dark:text-text-subtle">{s.note}</p></div>)}
    </section>

    <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(250px,.8fr)]">
      <div className="village-hero relative overflow-hidden rounded-[25px] p-7 text-white sm:p-9">
        <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-30 [background:radial-gradient(ellipse_at_85%_100%,#0c3428_0,transparent_58%)]" />
        <div className="relative"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[.18em]">Our home · {members.length || 1} villagers</span><h2 className="village-display mt-6 text-4xl sm:text-5xl">{villageName}</h2><p className="mt-1 text-sm text-white/70">{location}</p>
          <div className="mt-12 grid gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm backdrop-blur sm:grid-cols-3">
            <div><span className="block text-xl">18°C</span><small className="uppercase tracking-widest text-white/50">Temperature</small></div><div className="border-white/15 sm:border-x sm:px-5"><b className="block">Partly Cloudy</b><small className="uppercase tracking-widest text-white/50">Sky</small></div><div><b className="block">Connected</b><small className="uppercase tracking-widest text-white/50">Community</small></div>
          </div>
        </div>
      </div>
      <aside className="village-panel flex min-h-[285px] flex-col p-5"><div className="flex items-center justify-between"><h2 className="village-display text-xl">Your Neighbours</h2><span className="rounded-full bg-[#eaf1ec] px-2 py-1 text-[10px] font-bold text-[#42634f]">{members.length}</span></div><div className="mt-4 space-y-4">{members.slice(0, 3).map((m, i) => <div className="flex items-center gap-3" key={m._id}><span className={`neighbor-avatar n${i}`}>{m.name?.charAt(0)}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{m.name}{m._id === user?._id ? ' (you)' : ''}</p><p className="truncate text-[11px] text-text-subtle">{m.email}</p></div></div>)}{!members.length && <p className="py-8 text-sm text-text-subtle">Join a village to meet your neighbours.</p>}</div><Link className="mt-auto text-xs font-bold text-[#e56b43]" to="/dashboard/family">View all villagers →</Link></aside>
    </section>

    <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(250px,.8fr)]">
      <div className="village-panel overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="village-display text-xl">Recent News</h2><Link className="text-xs font-bold text-[#e56b43]" to="/dashboard/news">View all</Link></div>{recent.length ? recent.map((item) => <article className="flex gap-4 border-b border-line px-5 py-4 last:border-0" key={item._id}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0df] text-[#ed9b3c]">⌁</span><div><h3 className="text-sm font-bold">{item.text?.slice(0, 70) || 'Village update'}</h3><p className="mt-1 text-xs text-text-subtle">Shared with your village community</p><p className="mt-2 text-[9px] uppercase tracking-[.15em] text-[#a99c94]">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'Recently'}</p></div></article>) : <div className="px-5 py-10 text-center text-sm text-text-subtle">No village news yet.</div>}</div>
      <div className="village-panel p-5"><h2 className="village-display text-xl">Quick Actions</h2><div className="mt-4 space-y-3"><Link className="quick-action" to="/dashboard/family"><span>＋</span>Add Family Member</Link><Link className="quick-action" to="/dashboard/news"><span>⌁</span>Post an Update</Link><Link className="quick-action" to="/dashboard/events"><span>□</span>Create an Event</Link></div></div>
    </section>

    <section className="mt-10"><div className="mb-5 flex items-center gap-4"><h2 className="village-display whitespace-nowrap text-2xl">Village Square</h2><div className="h-px flex-1 bg-[#e7ded4] dark:bg-line" /><span className="text-[9px] uppercase tracking-[.2em] text-text-subtle">6 places</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{tiles.map((t) => <Link className="square-tile" to={t.to} key={t.title}><span className={`tile-icon ${t.color}`}><Icon name={t.icon} /></span><div><h3 className="font-bold">{t.title}<span className="float-right font-normal text-text-subtle">↗</span></h3><p className="mt-1 text-sm text-text-subtle">{t.desc}</p></div></Link>)}</div></section>
    <VillageSetupModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => refetch()} />
  </div>;
}
