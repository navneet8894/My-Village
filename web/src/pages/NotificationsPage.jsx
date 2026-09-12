import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from '../app/apiSlice';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QueryState } from '../components/TripUI';

export default function NotificationsPage() {
  const query = useGetNotificationsQuery();
  const { data } = query;
  const [markRead, marking] = useMarkNotificationsReadMutation();

  async function mark(ids) {
    try { await markRead(ids).unwrap(); }
    catch { toast.error('Could not mark notifications read. Try again.'); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <button
        type="button"
        disabled={marking.isLoading || !data?.some(n => !n.read)}
        className="mt-2 text-sm text-primary"
        onClick={() => mark((data || []).filter((n) => !n.read).map((n) => n._id))}
      >
        Mark all read
      </button>
      <QueryState query={query} empty={!data?.length} emptyText="No notifications yet."><ul className="mt-4 space-y-2">
        {(data || []).map((n) => (
          <li
            key={n._id}
            className={`rounded-lg border border-line p-3 ${n.read ? 'opacity-60' : 'bg-primary-muted/60'}`}
          >
            <div className="font-medium">{n.title}</div>
            <p className="text-sm text-text-muted">{n.body}</p>
            <p className="text-xs text-text-subtle mt-1">{n.type}</p>
            {n.type === 'trip' && n.data?.tripId && <Link className="mt-2 inline-block py-2 text-sm font-semibold text-primary-text" to={`/dashboard/trips/${n.data.tripId}`}>View trip →</Link>}
            {!n.read && (
              <button
                type="button"
                disabled={marking.isLoading}
                className="text-xs text-primary mt-1"
                onClick={() => mark([n._id])}
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul></QueryState>
    </div>
  );
}
