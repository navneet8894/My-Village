import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetMyVillageQuery } from '../app/apiSlice';
import VillageSetupModal from '../components/VillageSetupModal';

const cards = [
  { to: '/dashboard/family', title: 'Family', desc: 'Members & family tree' },
  { to: '/dashboard/map', title: 'Village map', desc: 'Events & village pin' },
  { to: '/dashboard/events', title: 'Events', desc: 'Community gatherings' },
  { to: '/dashboard/news', title: 'Instant news', desc: 'Photos, video, voice' },
  { to: '/dashboard/invitations', title: 'Invitations', desc: 'Personal celebrations' },
  { to: '/dashboard/notifications', title: 'Notifications', desc: 'Alerts & reminders' },
];

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const [modalOpen, setModalOpen] = useState(false);
  const { data: villageData, refetch } = useGetMyVillageQuery(undefined, {
    skip: user?.role === 'admin',
  });

  const hasVillage = user?.villageId || villageData?.village;
  const village = villageData?.village;
  const members = villageData?.members || [];

  useEffect(() => {
    if (user?.role !== 'admin' && !hasVillage) {
      setModalOpen(true);
    }
  }, [user?.role, hasVillage]);

  if (user?.role === 'admin') {
    return (
      <div>
        <h1 className="text-2xl font-bold">Hello, {user?.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Admin — use the sidebar to manage villages and users.</p>
        <Link
          to="/dashboard/admin"
          className="inline-block mt-6 rounded-lg bg-brand-600 text-white px-5 py-2.5 font-medium"
        >
          Go to admin dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome to MY VILLAGE — stay connected and informed.
          </p>
        </div>
        {!hasVillage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            Add your village
          </button>
        )}
      </div>

      {!hasVillage && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 p-6 text-center">
          <p className="font-medium text-brand-800 dark:text-brand-200">
            Set your village to connect with neighbours
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Select your country, state, district, and village. Users in the same village can see each
            other&apos;s posts and events.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-lg bg-brand-600 text-white px-5 py-2 font-medium"
          >
            Add your village
          </button>
        </div>
      )}

      {hasVillage && village && (
        <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="font-semibold text-lg">Your village</h2>
          <p className="text-brand-700 dark:text-brand-400 font-medium mt-1">{village.name}</p>
          <p className="text-sm text-slate-500">
            {village.district}, {village.state}, {village.country}
          </p>

          <h3 className="font-medium mt-5 mb-3">
            Villagers ({members.length})
          </h3>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">You are the first member in this village.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {members.map((m) => (
                <li
                  key={m._id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3"
                >
                  <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center font-semibold text-brand-700">
                    {m.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {m.name}
                      {m._id === user?._id ? ' (you)' : ''}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-brand-500 hover:shadow-md transition bg-white dark:bg-slate-900"
          >
            <div className="font-semibold text-lg">{c.title}</div>
            <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>

      <VillageSetupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
