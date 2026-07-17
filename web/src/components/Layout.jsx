import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import ThemeToggle from './ThemeToggle';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-primary text-primary-contrast'
      : 'text-text-muted hover:bg-soft hover:text-text'
  }`;

export default function Layout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-56 border-b md:border-b-0 md:border-r border-line bg-card/80 backdrop-blur md:min-h-screen p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-primary-text">MY VILLAGE</div>
          <ThemeToggle compact />
        </div>
        <nav className="flex md:flex-col flex-wrap gap-1">
          {user?.role === 'admin' ? (
            <>
              <NavLink to="/dashboard/admin" end className={linkClass}>
                Admin dashboard
              </NavLink>
              <NavLink to="/dashboard/admin/users" className={linkClass}>
                All users
              </NavLink>
              <NavLink to="/dashboard/admin/villages" className={linkClass}>
                All villages
              </NavLink>
              <NavLink to="/dashboard/admin/events" className={linkClass}>
                Manage events
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" end className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/dashboard/family" className={linkClass}>
                Family
              </NavLink>
              <NavLink to="/dashboard/map" className={linkClass}>
                Map
              </NavLink>
              <NavLink to="/dashboard/events" className={linkClass}>
                Events
              </NavLink>
              <NavLink to="/dashboard/news" className={linkClass}>
                News
              </NavLink>
              <NavLink to="/dashboard/invitations" className={linkClass}>
                Invitations
              </NavLink>
              <NavLink to="/dashboard/notifications" className={linkClass}>
                Alerts
              </NavLink>
            </>
          )}
          <NavLink to="/dashboard/profile" className={linkClass}>
            Profile
          </NavLink>
        </nav>
        <div className="mt-auto text-xs text-text-subtle">
          <div className="font-medium text-text">{user?.name}</div>
          <div className="capitalize">{user?.role}</div>
          <button
            type="button"
            className="mt-2 text-danger hover:underline"
            onClick={() => {
              dispatch(logout());
              navigate('/');
            }}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
