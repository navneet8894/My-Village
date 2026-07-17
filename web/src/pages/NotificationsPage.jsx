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
        className="mt-2 text-sm text-primary"
        onClick={() => mark((data || []).filter((n) => !n.read).map((n) => n._id))}
      >
        Mark all read
      </button>
      <ul className="mt-4 space-y-2">
        {(data || []).map((n) => (
          <li
            key={n._id}
            className={`rounded-lg border border-line p-3 ${n.read ? 'opacity-60' : 'bg-primary-muted/60'}`}
          >
            <div className="font-medium">{n.title}</div>
            <p className="text-sm text-text-muted">{n.body}</p>
            <p className="text-xs text-text-subtle mt-1">{n.type}</p>
            {!n.read && (
              <button
                type="button"
                className="text-xs text-primary mt-1"
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
