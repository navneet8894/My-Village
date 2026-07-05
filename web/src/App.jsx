import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useGetMeQuery } from './app/apiSlice';
import { setCredentials, setUser } from './features/auth/authSlice';
import Layout from './components/Layout';
import Spinner from './components/Spinner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import DashboardPage from './pages/DashboardPage';
import FamilyPage from './pages/FamilyPage';
import MapPage from './pages/MapPage';
import EventsPage from './pages/EventsPage';
import EventAdminPage from './pages/EventAdminPage';
import NewsPage from './pages/NewsPage';
import InvitationsPage from './pages/InvitationsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminVillagesPage from './pages/AdminVillagesPage';
import AdminVillageDetailPage from './pages/AdminVillageDetailPage';

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

  useEffect(() => {
    if (isSuccess && data) dispatch(setUser(data));
  }, [isSuccess, data, dispatch]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) dispatch(setCredentials({ token: t }));
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<GuestLanding />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<VerifyOtpPage />} />
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
  );
}
