import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useGetEventsQuery, useGetInvitationsQuery, useGetMyVillageQuery, useGetNewsQuery, useGetFamilyQuery, useGetTripsQuery, useAdminStatsQuery, useAdminPostAnnouncementMutation } from '../app/apiSlice';
import VillageMap from '../components/VillageMap';
import VillageSetupModal from '../components/VillageSetupModal';
import { Modal, QueryState, TripCard, tripDate, tripOpen } from '../components/TripUI';
import { Button } from '../shared/ui';

function Section({ title, to, children }) {
  return <section className="village-panel min-w-0 p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="village-display text-2xl">{title}</h2>{to && <Link className="py-2 text-sm font-semibold text-primary-text" to={to}>View all →</Link>}</div>{children}</section>;
}
function Announcement({ onClose }) {
  const [send, state] = useAdminPostAnnouncementMutation();
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setError('');
    const data = new FormData(e.currentTarget);
    try { await send({ title: data.get('title'), body: data.get('body') }).unwrap(); toast.success('Announcement sent'); onClose(); }
    catch (err) { setError(err?.data?.message || 'Could not send announcement'); }
  }
  return <Modal title="Community announcement" onClose={() => !state.isLoading && onClose()}><form className="space-y-4" onSubmit={submit}><p className="text-sm text-text-subtle">This announcement goes to all registered villagers across managed villages.</p><label className="block text-sm">Title<input required name="title" className="theme-input mt-1 w-full" /></label><label className="block text-sm">Message<textarea required name="body" rows="4" className="theme-input mt-1 w-full" /></label>{error && <p role="alert" className="text-danger">{error}</p>}<Button type="submit" disabled={state.isLoading}>{state.isLoading ? 'Sending…' : 'Send announcement'}</Button></form></Modal>;
}
export default function DashboardPage() {
  const role = useSelector(s => s.auth.user?.role);
  return role === 'admin' ? <Navigate to="/dashboard/admin" replace /> : <VillagerDashboard />;
}
function VillagerDashboard() {
  const user = useSelector(s => s.auth.user);
  const admin = user?.role === 'admin';
  const villageQuery = useGetMyVillageQuery(undefined, { skip: admin, refetchOnMountOrArgChange: true, pollingInterval: 30000 });
  const eventsQuery = useGetEventsQuery();
  const newsQuery = useGetNewsQuery();
  const invitationsQuery = useGetInvitationsQuery();
  const familyQuery = useGetFamilyQuery();
  const tripsQuery = useGetTripsQuery(undefined, { skip: !admin && !user?.villageId });
  const statsQuery = useAdminStatsQuery(undefined, { skip: !admin, refetchOnMountOrArgChange: true, pollingInterval: 30000 });
  const [setup, setSetup] = useState(false);
  const [announcement, setAnnouncement] = useState(false);
  const village = villageQuery.data?.village;
  const events = (eventsQuery.data || []).filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
  const trips = (tripsQuery.data || []).filter(tripOpen);
  const news = (newsQuery.data || []).slice(0, 3);
  const family = familyQuery.data?.family;
  const head = family?.members?.find(m => m.isHead);
  const stats = [
    ['Total villagers', villageQuery.data?.population?.totalVillagers, villageQuery],
    ['Upcoming Functions', events.length, eventsQuery], ['Upcoming Trips', trips.length, tripsQuery],
    ['Invitations', invitationsQuery.data?.length, invitationsQuery],
  ];
  const hasCenter = village?.lat != null && village?.lng != null && Number.isFinite(Number(village.lat)) && Number.isFinite(Number(village.lng));
  return <div className="space-y-7">
    <section className="flex flex-wrap items-start justify-between gap-4"><div><p className="village-eyebrow">{admin ? 'Together, we care for our village' : 'Your community, closer'}</p><h1 className="village-display mt-2 text-3xl sm:text-4xl">Namaste, {user?.name?.split(' ')[0] || 'Villager'} <span className="text-[#DF6744]">☀</span></h1><p className="mt-2 text-sm text-text-muted">{admin ? 'Functions, people and shared plans across your villages.' : 'Aaj ' + (village?.name || 'aapke gaon') + ' mein kya ho raha hai.'}</p></div>{!admin && !user?.villageId && <Button onClick={() => setSetup(true)}>Add your village</Button>}{admin && <Button onClick={() => setAnnouncement(true)}>+ Announcement</Button>}</section>
    <section aria-label="Community statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(([label, value, query], i) => <div key={label} className="village-panel p-4 sm:p-5"><span className={'mb-4 grid h-10 w-10 place-items-center rounded-2xl ' + (i % 2 ? 'bg-primary-muted text-primary-text' : 'bg-[#fbe9df] text-[#b44d2c]')} aria-hidden="true">{['♧', '▦', '↗', '✉'][i]}</span><p className="text-3xl font-bold">{query.isLoading ? '…' : query.isError || value == null ? '—' : value}</p><h2 className="mt-1 text-sm text-text-muted">{label}</h2>{query.isError && <button className="mt-2 text-sm text-danger underline" onClick={query.refetch}>Retry</button>}</div>)}
    </section>
    <section aria-label="Quick actions" className="flex flex-wrap gap-2">
      {[[admin ? '/dashboard/admin/events' : '/dashboard/events', admin ? '+ Village function' : '+ Personal function'], ['/dashboard/news', '+ Post an update'], ['/dashboard/family', '+ Family member'], ['/dashboard/invitations', '+ Invitation'], ['/dashboard/trips', '↗ Plan a Trip'], ...(admin ? [['/dashboard/admin/users', 'Manage users'], ['/dashboard/admin/villages', 'Village directory']] : [])].map(([to, label]) => <Link className="rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold hover:bg-soft" key={to} to={to}>{label}</Link>)}
    </section>
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <Section title="Latest Village News" to="/dashboard/news"><QueryState query={newsQuery} empty={!news.length} emptyText="Your village feed is quiet. Share the first update."><div className="divide-y divide-line">{news.map(item => <article className="space-y-3 py-4 first:pt-0" key={item._id}><div className="flex flex-wrap justify-between gap-2 text-xs text-text-subtle"><span>{item.userId?.name || 'Village member'} · {item.kind}</span><time>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}</time></div><p className="whitespace-pre-wrap break-words text-sm">{item.text || 'A moment from our village'}</p>{item.mediaUrl && item.kind === 'photo' && <img loading="lazy" src={item.mediaUrl} alt={item.text || 'Village update'} className="max-h-52 w-full rounded-2xl object-cover" />}{item.mediaUrl && item.kind === 'video' && <video controls preload="none" src={item.mediaUrl} poster={item.thumbnailUrl || undefined} className="max-h-52 w-full rounded-2xl" />}{item.mediaUrl && item.kind === 'voice' && <audio controls preload="none" src={item.mediaUrl} className="w-full" />}</article>)}</div></QueryState></Section>
      <Section title="Upcoming Functions" to="/dashboard/events"><QueryState query={eventsQuery} empty={!events.length} emptyText="No upcoming functions. A new gathering will appear here."><div className="space-y-4">{events.slice(0, 4).map(event => <article key={event._id} className="rounded-2xl border border-line p-4"><span className="rounded-full bg-primary-muted px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-text">{event.eventType === 'personal' ? 'Personal function' : 'Village function'}</span><h3 className="mt-3 break-words font-bold">{event.title}</h3><p className="mt-2 text-xs text-text-muted">{tripDate(event.date)} IST{event.timing ? ' · ' + event.timing : ''}</p><p className="mt-1 break-words text-sm text-text-subtle">{event.place || 'Place to be announced'}</p></article>)}</div></QueryState></Section>
    </div>
    <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="village-eyebrow">A little adventure, a lot of togetherness</p><h2 className="village-display mt-1 text-3xl">Upcoming Trips</h2></div><Link className="py-2 font-semibold text-primary-text" to="/dashboard/trips">View trips &amp; plan an outing →</Link></div>{!admin && !user?.villageId ? <p className="text-text-muted">Join your village to discover shared trips.</p> : <QueryState query={tripsQuery} empty={!trips.length} emptyText="No trips planned yet. Where should the village go next?"><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{trips.slice(0, 3).map(trip => <TripCard key={trip._id} trip={trip} />)}</div></QueryState>}</section>
    <div className="grid gap-5 lg:grid-cols-2">
      <Section title="My Family" to="/dashboard/family"><QueryState query={familyQuery}><div className="rounded-2xl bg-primary-muted p-5 text-primary-text"><p className="text-xs uppercase tracking-widest">Family head</p><p className="mt-2 text-xl font-bold">{head?.displayName || 'Not selected'}</p><p className="mt-2 text-sm">{family?.members?.length ?? 0} family members</p></div><Link className="mt-5 inline-block py-2 font-semibold text-primary-text" to="/dashboard/family">View Family Tree →</Link></QueryState></Section>
      <Section title="Village Map" to="/dashboard/map">{hasCenter ? <div className="overflow-hidden rounded-2xl"><VillageMap center={{ lat: Number(village.lat), lng: Number(village.lng) }} villageName={village.name} events={events} height={240} /></div> : <div className="rounded-2xl bg-primary-muted p-6 text-primary-text"><p className="text-3xl" aria-hidden="true">◇</p><p className="mt-3">{admin ? 'Choose a village in the directory to view or update its exact map location.' : 'Your village map will appear once its location is set.'}</p><Link className="mt-4 inline-block font-bold underline" to={admin ? '/dashboard/admin/villages' : '/dashboard/map'}>{admin ? 'Open village directory' : 'Explore map'}</Link></div>}</Section>
    </div>
    <VillageSetupModal open={setup} onClose={() => setSetup(false)} onSuccess={() => { setSetup(false); villageQuery.refetch(); }} />{announcement && <Announcement onClose={() => setAnnouncement(false)} />}
  </div>;
}
