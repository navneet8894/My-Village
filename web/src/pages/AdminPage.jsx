import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useAdminStatsQuery,
  useAdminPostAnnouncementMutation,
  useAdminEmergencyMutation,
  useGetNewsQuery,
  useAdminDeleteNewsMutation,
} from '../app/apiSlice';

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-subtle">{label}</p>
          <p className="mt-1 text-3xl font-bold text-text">
            {value ?? '—'}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary text-lg">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: stats } = useAdminStatsQuery();
  const { data: news, refetch: refetchNews } = useGetNewsQuery();
  const [postAnn] = useAdminPostAnnouncementMutation();
  const [emergency] = useAdminEmergencyMutation();
  const [delNews] = useAdminDeleteNewsMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [emTitle, setEmTitle] = useState('');
  const [emBody, setEmBody] = useState('');

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-text-subtle text-sm mt-1">
          Overview and management for MY VILLAGE
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats?.userCount} icon="👥" />
        <StatCard label="Villages" value={stats?.villageCount} icon="🛖" />
        <StatCard label="Family members" value={stats?.totalMembers} icon="🏠" />
        <StatCard label="Total posts" value={stats?.postCount} icon="📰" />
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Village management</h2>
            <p className="text-sm text-text-subtle mt-1">
              View all villages, their users, posts, and events
            </p>
          </div>
          <Link
            to="/dashboard/admin/villages"
            className="rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast px-4 py-2 text-sm font-medium transition"
          >
            View all villages
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">User management</h2>
            <p className="text-sm text-text-subtle mt-1">
              View all registered users and their full details
            </p>
          </div>
          <Link
            to="/dashboard/admin/users"
            className="rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast px-4 py-2 text-sm font-medium transition"
          >
            View all users
          </Link>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-lg">Announcements</h2>
        <form
          className="mt-2 max-w-md space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await postAnn({ title, body }).unwrap();
              toast.success('Sent');
              setTitle('');
              setBody('');
            } catch (err) {
              toast.error(err?.data?.message || 'Failed');
            }
          }}
        >
          <input
            className="theme-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="theme-input"
            placeholder="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <button type="submit" className="rounded-lg bg-primary text-primary-contrast px-4 py-2">
            Broadcast
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-lg">Emergency alert</h2>
        <form
          className="mt-2 max-w-md space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await emergency({ title: emTitle, body: emBody }).unwrap();
              toast.success('Emergency push queued');
              setEmTitle('');
              setEmBody('');
            } catch (err) {
              toast.error(err?.data?.message || 'Failed');
            }
          }}
        >
          <input
            className="theme-input"
            placeholder="Title"
            value={emTitle}
            onChange={(e) => setEmTitle(e.target.value)}
            required
          />
          <textarea
            className="theme-input"
            placeholder="Message"
            value={emBody}
            onChange={(e) => setEmBody(e.target.value)}
            required
          />
          <button type="submit" className="rounded-lg bg-danger text-primary-contrast px-4 py-2">
            Send emergency
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold text-lg">Moderate news</h2>
        <ul className="mt-2 space-y-2">
          {(news || []).map((n) => (
            <li
              key={n._id}
              className="flex justify-between items-center border border-line rounded px-3 py-2 text-sm"
            >
              <span className="truncate max-w-md">{n.text || n.mediaUrl || n.kind}</span>
              <button
                type="button"
                className="text-danger shrink-0"
                onClick={async () => {
                  await delNews(n._id).unwrap();
                  refetchNews();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
