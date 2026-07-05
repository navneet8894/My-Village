import { Link } from 'react-router-dom';
import { useAdminVillagesQuery } from '../app/apiSlice';

export default function AdminVillagesPage() {
  const { data: villages, isLoading } = useAdminVillagesQuery();

  if (isLoading) return <p className="text-slate-500">Loading villages…</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/dashboard/admin" className="text-sm text-brand-600 hover:underline">
          ← Back to admin dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-1">All villages</h1>
        <p className="text-slate-500 text-sm mt-1">
          {villages?.length || 0} villages registered on MY VILLAGE
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(villages || []).map((v) => (
          <Link
            key={v._id}
            to={`/dashboard/admin/villages/${v._id}`}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-brand-500 hover:shadow-md transition"
          >
            <h2 className="font-semibold text-lg">{v.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {v.district}, {v.state}
            </p>
            <p className="text-xs text-slate-400">{v.country}</p>
            <div className="mt-4 flex gap-4 text-sm">
              <span>
                <strong>{v.userCount}</strong> users
              </span>
              <span>
                <strong>{v.postCount}</strong> posts
              </span>
              <span>
                <strong>{v.eventCount}</strong> events
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!(villages || []).length && (
        <p className="text-slate-500 text-center py-12">No villages registered yet.</p>
      )}
    </div>
  );
}
