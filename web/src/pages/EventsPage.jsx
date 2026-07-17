import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetEventsQuery } from '../app/apiSlice';

export default function EventsPage() {
  const user = useSelector((s) => s.auth.user);
  const { data, isLoading } = useGetEventsQuery();
  if (isLoading) return <p>Loading…</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold">Village events</h1>
      <div className="mt-6 space-y-4">
        {(data || []).map((e) => (
          <article
            key={e._id}
            className="rounded-xl border border-line overflow-hidden bg-card"
          >
            {e.bannerUrl && (
              <img src={e.bannerUrl} alt="" className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold">{e.title}</h2>
              <p className="text-sm text-text-subtle">
                {new Date(e.date).toLocaleString()} · {e.place || 'TBD'} · {e.timing}
              </p>
              <p className="mt-2 text-text-muted text-sm">{e.description}</p>
            </div>
          </article>
        ))}
      </div>
      {user?.role === 'admin' && (
        <Link to="/dashboard/admin/events" className="inline-block mt-6 text-primary text-sm font-medium">
          Manage events →
        </Link>
      )}
    </div>
  );
}
