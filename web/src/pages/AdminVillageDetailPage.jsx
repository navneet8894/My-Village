import { Link, useParams } from 'react-router-dom';
import { useAdminVillageDetailQuery } from '../app/apiSlice';

export default function AdminVillageDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useAdminVillageDetailQuery(id);

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (!data?.village) return <p>Village not found.</p>;

  const { village, users, posts, events } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard/admin/villages" className="text-sm text-brand-600 hover:underline">
          ← All villages
        </Link>
        <h1 className="text-2xl font-bold mt-1">{village.name}</h1>
        <p className="text-slate-500">
          {village.district}, {village.state}, {village.country}
        </p>
        {village.formattedAddress && (
          <p className="text-xs text-slate-400 mt-1">{village.formattedAddress}</p>
        )}
      </div>

      <section>
        <h2 className="font-semibold text-lg mb-3">Users ({users?.length || 0})</h2>
        <ul className="divide-y rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {(users || []).map((u) => (
            <li key={u._id} className="px-4 py-3 flex justify-between text-sm">
              <span className="font-medium">{u.name}</span>
              <span className="text-slate-500">{u.email}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Posts ({posts?.length || 0})</h2>
        <ul className="space-y-2">
          {(posts || []).map((p) => (
            <li
              key={p._id}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm"
            >
              <span className="font-medium">{p.userId?.name}</span>
              <span className="text-slate-400 mx-2">·</span>
              <span className="text-slate-600 dark:text-slate-300">
                {p.text || p.kind}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Events ({events?.length || 0})</h2>
        <ul className="space-y-2">
          {(events || []).map((e) => (
            <li
              key={e._id}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm"
            >
              <span className="font-medium">{e.title}</span>
              <span className="text-slate-400 mx-2">·</span>
              <span className="text-slate-500">{new Date(e.date).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
