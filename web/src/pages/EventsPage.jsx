import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card } from '../shared/ui';
import { useGetEventsQuery, useCreateEventMutation } from '../app/apiSlice';

export default function EventsPage() {
  const user = useSelector((s) => s.auth.user);
  const { data, isLoading } = useGetEventsQuery();
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [form, setForm] = useState({ title: '', description: '', date: '', place: '', timing: '' });
  if (isLoading) return <p>Loading…</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold">Village events</h1>
      {user?.role !== 'admin' && (
        <Card as="form" className="mt-4 grid max-w-xl gap-3 p-4" onSubmit={async (ev) => {
          ev.preventDefault();
          try {
            await createEvent({ ...form, eventType: 'personal' }).unwrap();
            setForm({ title: '', description: '', date: '', place: '', timing: '' });
            toast.success('Function invitation shared with your village');
          } catch (err) { toast.error(err?.data?.message || 'Could not add function'); }
        }}>
          <h2 className="font-semibold">Invite villagers to a function</h2>
          <input required className="theme-input" placeholder="Function title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="theme-input" placeholder="Invitation details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input required type="datetime-local" className="theme-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input className="theme-input" placeholder="Place" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
          <input className="theme-input" placeholder="Timing details" value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} />
          <Button type="submit" disabled={isCreating}>Send invitation</Button>
        </Card>
      )}
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
              <span className="text-xs font-medium text-primary">{e.eventType === 'personal' ? 'Personal function' : 'Village function'}</span>
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
