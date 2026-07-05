import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useAdminUsersQuery,
  useAdminBanMutation,
  useAdminUnbanMutation,
} from '../app/apiSlice';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const { data: users, refetch, isLoading } = useAdminUsersQuery();
  const [ban] = useAdminBanMutation();
  const [unban] = useAdminUnbanMutation();
  const [selected, setSelected] = useState(null);

  if (isLoading) {
    return <p className="text-slate-500">Loading users…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/dashboard/admin" className="text-sm text-brand-600 hover:underline">
            ← Back to admin dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">All users</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {users?.length || 0} registered accounts
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(users || []).map((u) => (
                <tr
                  key={u._id}
                  onClick={() => setSelected(u)}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                    selected?._id === u._id ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.isBanned ? (
                      <span className="text-red-600 text-xs font-medium">Banned</span>
                    ) : u.isEmailVerified ? (
                      <span className="text-brand-600 text-xs font-medium">Verified</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 h-fit">
          {selected ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">{selected.name}</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium break-all">{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd>{selected.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Role</dt>
                  <dd className="capitalize">{selected.role}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Village</dt>
                  <dd>
                    {selected.villageLocation?.village
                      ? `${selected.villageLocation.village}, ${selected.villageLocation.district}, ${selected.villageLocation.state}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Address</dt>
                  <dd>{selected.address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Bio</dt>
                  <dd>{selected.bio || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email verified</dt>
                  <dd>{selected.isEmailVerified ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Joined</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                </div>
                {selected.isBanned && (
                  <div>
                    <dt className="text-slate-500">Ban reason</dt>
                    <dd className="text-red-600">{selected.banReason || '—'}</dd>
                  </div>
                )}
              </dl>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                {!selected.isBanned ? (
                  <button
                    type="button"
                    className="w-full rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 text-sm font-medium"
                    onClick={async () => {
                      try {
                        await ban({ id: selected._id, reason: 'Moderation' }).unwrap();
                        toast.success('User banned');
                        refetch();
                        setSelected({ ...selected, isBanned: true, banReason: 'Moderation' });
                      } catch (err) {
                        toast.error(err?.data?.message || 'Failed');
                      }
                    }}
                  >
                    Ban user
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-lg bg-brand-600 text-white py-2 text-sm font-medium"
                    onClick={async () => {
                      try {
                        await unban(selected._id).unwrap();
                        toast.success('User unbanned');
                        refetch();
                        setSelected({ ...selected, isBanned: false, banReason: '' });
                      } catch (err) {
                        toast.error(err?.data?.message || 'Failed');
                      }
                    }}
                  >
                    Unban user
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Select a user from the list to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
