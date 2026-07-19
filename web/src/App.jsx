import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { lazy, Suspense, useEffect } from 'react';
import { useGetMeQuery } from './app/apiSlice';
import { setCredentials, setUser } from './features/auth/authSlice';
import Layout from './components/Layout';
import Spinner from './components/Spinner';
import LanguageSwitcher from './components/LanguageSwitcher';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FamilyPage = lazy(() => import('./pages/FamilyPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventAdminPage = lazy(() => import('./pages/EventAdminPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const InvitationsPage = lazy(() => import('./pages/InvitationsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminVillagesPage = lazy(() => import('./pages/AdminVillagesPage'));
const AdminVillageDetailPage = lazy(() => import('./pages/AdminVillageDetailPage'));

function PrivateRoute({ children, admin }) {
  const token = useSelector((s) => s.auth.token);
  const { data: me, isLoading } = useGetMeQuery(undefined, { skip: !token });
  if (!token) return <Navigate to="/login" replace />;
  if (token && isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  if (admin && me?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestLanding() {
  const token = useSelector((s) => s.auth.token);
  const user = useSelector((s) => s.auth.user);
  const { data: me, isLoading } = useGetMeQuery(undefined, { skip: !token });

  if (token && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const role = me?.role || user?.role;
  if (token && role) {
    return <Navigate to={role === 'admin' ? '/dashboard/admin' : '/dashboard'} replace />;
  }

  return <LandingPage />;
}

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);
  const { data, isSuccess } = useGetMeQuery(undefined, { skip: !token });
  const location = useLocation();
  const authPage = ['/login', '/register', '/verify', '/forgot-password'].includes(location.pathname);

  useEffect(() => {
    if (isSuccess && data) dispatch(setUser(data));
  }, [isSuccess, data, dispatch]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) dispatch(setCredentials({ token: t }));
  }, [dispatch]);

  return (
    <>
    {authPage && <LanguageSwitcher className="fixed right-16 top-4 z-50 sm:right-20" />}
    <Suspense fallback={<div className="grid min-h-[40vh] place-items-center"><Spinner /></div>}>
    <Routes>
      <Route path="/" element={<GuestLanding />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="family" element={<FamilyPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="invitations" element={<InvitationsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin/events"
          element={
            <PrivateRoute admin>
              <EventAdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <PrivateRoute admin>
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <PrivateRoute admin>
              <AdminUsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/villages"
          element={
            <PrivateRoute admin>
              <AdminVillagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/villages/:id"
          element={
            <PrivateRoute admin>
              <AdminVillageDetailPage />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}
