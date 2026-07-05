import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from '../app/apiSlice';

export default function NotificationsPage() {
  const { data, refetch } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationsReadMutation();

  async function mark(ids) {
    await markRead(ids).unwrap();
    refetch();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <button
        type="button"
        className="mt-2 text-sm text-brand-600"
        onClick={() => mark((data || []).filter((n) => !n.read).map((n) => n._id))}
      >
        Mark all read
      </button>
      <ul className="mt-4 space-y-2">
        {(data || []).map((n) => (
          <li
            key={n._id}
            className={`rounded-lg border p-3 dark:border-slate-800 ${n.read ? 'opacity-60' : 'bg-brand-50/50 dark:bg-slate-900'}`}
          >
            <div className="font-medium">{n.title}</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{n.body}</p>
            <p className="text-xs text-slate-400 mt-1">{n.type}</p>
            {!n.read && (
              <button
                type="button"
                className="text-xs text-brand-600 mt-1"
                onClick={() => mark([n._id])}
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
