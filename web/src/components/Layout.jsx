import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { apiSlice, useGetMyVillageQuery, useGetUnreadCountQuery } from '../app/apiSlice';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '../shared/ui';
import '../styles/community.css';

const items = [
  ['family', 'My Family', '♧'], ['map', 'Village Map', '◇'], ['events', 'Functions', '▦'],
  ['invitations', 'Invitations', '✉'], ['news', 'Instant News', '≋'], ['trips', 'Village Trips', '↗'],
  ['notifications', 'Notifications', '♧'], ['profile', 'Profile', '○'],
];
function MenuLink({ to, children, onClick, compact = false }) {
  return <NavLink end={to === '/dashboard' || to === '/dashboard/admin'} onClick={onClick} to={to} className={({ isActive }) => [
    compact ? 'flex min-h-14 flex-1 items-center justify-center px-1 text-xs' : 'flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm',
    'font-semibold transition', isActive ? 'bg-primary-muted text-primary-text' : 'text-text-muted hover:bg-soft',
  ].join(' ')}>{children}</NavLink>;
}
export default function Layout() {
  const user = useSelector(s => s.auth.user);
  const admin = user?.role === 'admin';
  const home = admin ? '/dashboard/admin' : '/dashboard';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [more, setMore] = useState(false);
  const { data } = useGetMyVillageQuery(undefined, { skip: admin });
  const notifications = useGetUnreadCountQuery(undefined, { pollingInterval: 60000 });
  const unread = notifications.data?.count || 0;
  const navigation = <>
    <MenuLink to={home} onClick={() => setMore(false)}><span aria-hidden="true">⌂</span>Dashboard</MenuLink>
    {items.map(([path, label, icon]) => <MenuLink key={path} to={'/dashboard/' + path} onClick={() => setMore(false)}><span className="w-5 text-center" aria-hidden="true">{icon}</span>{label}</MenuLink>)}
    {admin && <><p className="px-4 pb-1 pt-5 text-xs font-bold uppercase tracking-widest text-text-subtle">Administration</p>
      {[['admin/users', 'Manage users'], ['admin/villages', 'Village directory'], ['admin/events', 'Village functions']].map(([path, label]) => <MenuLink key={path} to={'/dashboard/' + path} onClick={() => setMore(false)}>{label}</MenuLink>)}</>}
  </>;
  function signOut() { dispatch(logout()); dispatch(apiSlice.util.resetApiState()); navigate('/'); }
  return <div className="community-shell min-h-screen bg-app text-text md:flex">
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-card md:flex">
      <NavLink to={home} className="px-7 pb-8 pt-9"><span className="village-display text-3xl text-primary-text">My Village<span className="text-[#DF6744]">.</span></span><span className="mt-2 block text-[10px] uppercase tracking-[.2em] text-text-subtle">Our people. Our place.</span></NavLink>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 pb-5">{navigation}</nav>
      <div className="border-t border-line p-5"><NavLink to="/dashboard/profile" className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-muted font-bold text-primary-text">{user?.name?.charAt(0)}</span><div className="min-w-0"><b className="block truncate text-sm">{user?.name}</b><span className="text-xs text-text-subtle">{admin ? 'Village Admin' : 'Villager'}</span></div></NavLink><Button variant="ghost" className="mt-3" onClick={signOut}>Log out</Button></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex min-h-[76px] flex-wrap items-center justify-between gap-2 border-b border-line bg-app/95 px-4 py-3 backdrop-blur sm:px-8">
        <NavLink className="min-w-0 max-w-[12rem] truncate font-semibold text-primary-text" to={home}>{admin ? 'Village administration' : data?.village?.name || 'My Village'}</NavLink>
        <div className="flex items-center gap-2"><LanguageSwitcher /><ThemeToggle compact /><NavLink aria-label={unread ? 'Notifications, ' + unread + ' unread' : 'Notifications'} to="/dashboard/notifications" className="relative grid h-11 w-11 place-items-center rounded-full border border-line bg-card"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#b44d2c] px-1.5 text-[10px] text-white">{unread > 99 ? '99+' : unread}</span>}</NavLink></div>
      </header>
      <main className="mx-auto max-w-[1320px] p-4 pb-28 sm:p-6 sm:pb-28 md:p-8"><Outlet /></main>
    </div>
    {more && <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] top-20 z-40 overflow-y-auto border-t border-line bg-card p-4 shadow-xl md:hidden"><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Explore My Village</h2><Button variant="ghost" onClick={() => setMore(false)}>Close</Button></div><nav aria-label="More navigation">{navigation}</nav><Button variant="ghost" onClick={signOut}>Log out</Button></div>}
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {[[home, 'Home'], ['/dashboard/events', 'Functions'], ['/dashboard/trips', 'Trips'], ['/dashboard/news', 'News']].map(([to, label]) => <MenuLink key={to} compact to={to} onClick={() => setMore(false)}>{label}</MenuLink>)}
      <button className="min-h-14 flex-1 text-xs font-semibold text-primary-text" aria-expanded={more} onClick={() => setMore(!more)}>More {more ? '−' : '+'}</button>
    </nav>
  </div>;
}
