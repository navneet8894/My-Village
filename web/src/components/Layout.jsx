import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

const paths = {
  '/dashboard/admin': 'Dashboard', '/dashboard/admin/users': 'Users',
  '/dashboard/admin/villages': 'Villages', '/dashboard/admin/events': 'Village Functions',
  '/dashboard/profile': 'Profile',
};

function NavIcon({ type }) {
  const d = {
    dashboard: 'M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    family: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
    map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15',
    event: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2Z',
    news: 'M4 4h16v16H4zM8 8h8m-8 4h8m-8 4h5',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4',
    profile: 'M20 21a8 8 0 0 0-16 0m8-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m15-6.5-1.4 1.4M6.9 17.1l-1.4 1.4m13 0-1.4-1.4M6.9 6.9 5.5 5.5',
  }[type];
  return <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function SideLink({ to, icon, children, end }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/30 dark:from-blue-500 dark:to-indigo-500' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><NavIcon type={icon} />{children}</NavLink>;
}

function UserSideLink({ to, icon, children, end }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-[#fcebe4] text-[#e5633d] dark:bg-primary-muted dark:text-primary-text' : 'text-[#7c716a] hover:bg-[#faf3ec] hover:text-[#3c3029] dark:text-text-subtle dark:hover:bg-soft dark:hover:text-text'}`}><NavIcon type={icon} />{children}</NavLink>;
}

function UserLayout({ user, dispatch, navigate }) {
  return <div className="min-h-screen bg-[#fffaf2] text-[#3d312b] dark:bg-app dark:text-text md:flex">
    <aside className="border-b border-[#ebe4db] bg-[#fffefa] dark:border-line dark:bg-card md:sticky md:top-0 md:flex md:h-screen md:w-[245px] md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex h-[92px] items-center justify-between px-5 md:h-auto md:block md:px-7 md:pb-8 md:pt-9"><div><p className="village-display text-2xl font-semibold text-[#e4613d]">My Village</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.22em] text-[#998e86]">Community · Home</p></div><div className="md:hidden"><ThemeToggle compact /></div></div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-4 md:flex-1 md:flex-col md:space-y-1 md:overflow-y-auto md:pb-6">
        <UserSideLink to="/dashboard" icon="dashboard" end>Home</UserSideLink><UserSideLink to="/dashboard/family" icon="family">Family</UserSideLink><UserSideLink to="/dashboard/map" icon="map">Village Map</UserSideLink><UserSideLink to="/dashboard/events" icon="event">Events</UserSideLink><UserSideLink to="/dashboard/news" icon="news">Instant News</UserSideLink><UserSideLink to="/dashboard/invitations" icon="event">Invitations</UserSideLink>
      </nav>
      <div className="hidden border-t border-[#eee8df] p-5 dark:border-line md:block"><NavLink to="/dashboard/profile" className="flex items-center gap-3 rounded-2xl border border-[#ebe4db] bg-white p-3 shadow-sm dark:border-line dark:bg-soft"><span className="village-display grid h-10 w-10 place-items-center rounded-full bg-[#e8f0eb] text-lg text-[#37634b]">{user?.name?.charAt(0)}</span><span className="min-w-0 flex-1"><small className="block text-[8px] font-bold uppercase tracking-[.15em] text-text-subtle">Villager</small><b className="block truncate text-xs">{user?.name}</b></span></NavLink><button className="mt-3 w-full text-center text-xs text-[#a09288] hover:text-[#e4613d]" onClick={() => { dispatch(logout()); navigate('/'); }}>Log out</button></div>
    </aside>
    <div className="min-w-0 flex-1"><header className="flex h-[72px] items-center justify-end gap-3 border-b border-[#ebe4db] bg-[#fffaf2]/90 px-4 backdrop-blur dark:border-line dark:bg-app/90 md:px-8"><ThemeToggle compact /><NavLink to="/dashboard/notifications" className="relative rounded-full border border-[#e7dfd5] bg-white p-2.5 text-[#786c64] dark:border-line dark:bg-card"><NavIcon type="bell" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ee5d55] ring-2 ring-white" /></NavLink><LanguageSwitcher /></header><main className="mx-auto w-full max-w-[1180px] p-4 pb-12 sm:p-6 md:p-10"><Outlet /></main></div>
  </div>;
}

function AdminLayout({ user, dispatch, navigate }) {
  const location = useLocation();
  const title = paths[location.pathname] || (location.pathname.includes('/villages/') ? 'Village Details' : 'Dashboard');
  return (
    <div className="admin-shell min-h-screen bg-[#f5f7fc] text-slate-900 dark:bg-app dark:text-text md:flex">
      <aside className="z-50 flex border-b border-white/10 bg-gradient-to-b from-[#071a3a] via-[#071a36] to-[#06142d] text-white dark:from-[#020617] dark:via-[#071226] dark:to-[#020617] md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-emerald-400 text-xl shadow-lg">🏡</span>
          <div className="leading-tight"><p className="font-bold">Village Management</p><p className="text-sm font-semibold">System</p></div>
        </div>
        <nav className="flex flex-1 gap-2 overflow-x-auto p-3 md:block md:space-y-1 md:overflow-y-auto">
          <SideLink to="/dashboard/admin" icon="dashboard" end>Dashboard</SideLink>
          <p className="hidden px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 md:block">Main</p>
          <SideLink to="/dashboard/admin/users" icon="users">Users</SideLink>
          <SideLink to="/dashboard/family" icon="family">Families</SideLink>
          <SideLink to="/dashboard/family" icon="users">Family Tree</SideLink>
          <SideLink to="/dashboard/map" icon="map">Village Map</SideLink>
          <p className="hidden px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 md:block">Events</p>
          <SideLink to="/dashboard/admin/events" icon="event">Village Functions</SideLink>
          <SideLink to="/dashboard/events" icon="users">User Functions</SideLink>
          <SideLink to="/dashboard/invitations" icon="event">Invitations</SideLink>
          <p className="hidden px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 md:block">Communication</p>
          <SideLink to="/dashboard/news" icon="news">Instant Information</SideLink>
          <SideLink to="/dashboard/notifications" icon="bell">Notifications</SideLink>
          <SideLink to="/dashboard/profile" icon="news">Announcements</SideLink>
          <p className="hidden px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400 md:block">Others</p>
          <SideLink to="/dashboard/news" icon="news">Gallery</SideLink>
          <SideLink to="/dashboard/admin" icon="dashboard">Reports</SideLink>
          <SideLink to="/dashboard/profile" icon="settings">Settings</SideLink>
        </nav>
        <div className="hidden p-3 md:block">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-400 font-bold text-[#071a36]">{user?.name?.charAt(0)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="text-xs text-slate-400">Village Admin</p></div></div>
            <button className="mt-3 text-xs text-rose-300 hover:text-rose-200" onClick={() => { dispatch(logout()); navigate('/'); }}>Log out</button>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur dark:border-line dark:bg-surface/95 md:px-6">
          <button type="button" aria-label="Toggle navigation" className="rounded-lg p-2 text-[#18345f] hover:bg-slate-100 dark:text-text-muted dark:hover:bg-soft"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <h1 className="text-xl font-bold text-[#0b1739] dark:text-text">{title}</h1>
          <div className="mx-auto hidden w-full max-w-sm items-center rounded-full bg-slate-100 px-4 py-2.5 text-slate-400 dark:bg-soft dark:text-text-subtle lg:flex"><svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-text dark:placeholder:text-text-subtle" placeholder="Search anything..." /></div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2"><ThemeToggle compact /><LanguageSwitcher /><NavLink to="/dashboard/notifications" className="relative rounded-lg p-2 text-[#0b1739] hover:bg-slate-100 dark:text-text-muted dark:hover:bg-soft"><NavIcon type="bell" /><span className="absolute right-0 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white ring-2 ring-white dark:ring-surface">5</span></NavLink><NavLink to="/dashboard/news" className="relative rounded-lg p-2 text-[#0b1739] hover:bg-slate-100 dark:text-text-muted dark:hover:bg-soft"><svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18v13H3zM3 7l9 7 9-7"/></svg><span className="absolute right-0 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white ring-2 ring-white dark:ring-surface">3</span></NavLink><NavLink to="/dashboard/profile" className="ml-2 hidden items-center gap-2 border-l border-slate-200 pl-4 dark:border-line sm:flex"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white">{user?.name?.charAt(0)}</div><div><p className="text-xs font-bold">{user?.name || 'Admin'}</p><p className="text-[10px] text-slate-500 dark:text-text-subtle">Village Admin</p></div><svg className="ml-2 h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="m5 7 5 5 5-5"/></svg></NavLink></div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-5"><Outlet /></main>
      </div>
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate(); const dispatch = useDispatch(); const user = useSelector((s) => s.auth.user); const location = useLocation();
  const isAdminLayout = user?.role === 'admin' || location.pathname === '/dashboard/admin' || location.pathname.startsWith('/dashboard/admin/');
  if (isAdminLayout) return <AdminLayout user={user} dispatch={dispatch} navigate={navigate} />;
  return <UserLayout user={user} dispatch={dispatch} navigate={navigate} />;
}
