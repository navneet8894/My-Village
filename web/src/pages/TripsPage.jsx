import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useGetTripsQuery, useGetTripQuery, useGetTripParticipantsQuery, useCreateTripMutation, useUpdateTripMutation, useAdminVillagesQuery, useUploadFileMutation } from '../app/apiSlice';
import { Button } from '../shared/ui';
import { Modal, Participation, QueryState, TripCard, tripDate, tripOpen } from '../components/TripUI';

const localIST = value => value ? new Date(new Date(value).getTime() + 330 * 60000).toISOString().slice(0, 16) : '';
function TripForm({ trip, onClose }) {
  const user = useSelector(s => s.auth.user);
  const navigate = useNavigate();
  const villages = useAdminVillagesQuery(undefined, { skip: user?.role !== 'admin' || !!trip });
  const [create, creating] = useCreateTripMutation();
  const [update, updating] = useUpdateTripMutation();
  const [upload, uploading] = useUploadFileMutation();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: trip?.title || '', destination: trip?.destination || '', meetingPoint: trip?.meetingPoint || '', departureAt: localIST(trip?.departureAt), returnAt: localIST(trip?.returnAt), description: trip?.description || '', estimatedCost: trip?.estimatedCost ?? '', coverUrl: trip?.coverUrl || '', villageId: '' });
  const busy = creating.isLoading || updating.isLoading || uploading.isLoading;
  const field = (name, label, type = 'text', required = false) => <label className="block text-sm font-medium">{label}{required && ' *'}<input required={required} type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} className="theme-input mt-1 w-full" value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} /></label>;
  async function submit(e) {
    e.preventDefault(); setError('');
    try {
      const body = { ...form, departureAt: new Date(`${form.departureAt}:00+05:30`).toISOString(), returnAt: form.returnAt ? new Date(`${form.returnAt}:00+05:30`).toISOString() : null, estimatedCost: form.estimatedCost === '' ? null : Number(form.estimatedCost) };
      if (trip || user?.role !== 'admin') delete body.villageId;
      const saved = await (trip ? update({ id: trip._id, ...body }) : create(body)).unwrap();
      if (saved.notificationWarning) toast(saved.notificationWarning, { duration: 6000 }); else toast.success('Trip saved');
      onClose(); navigate(`/dashboard/trips/${saved._id}`);
    } catch (err) { setError(err?.data?.message || 'Could not save the trip. Check the details and try again.'); }
  }
  async function uploadCover(e) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setError('Choose an image under 10 MB'); return; }
    setError('');
    try { const data = new FormData(); data.append('file', file); const result = await upload(data).unwrap(); setForm(f => ({ ...f, coverUrl: result.url })); }
    catch (err) { setError(err?.data?.message || 'Photo upload failed. Try again.'); }
  }
  return <Modal title={trip ? 'Edit trip' : 'Plan a village trip'} onClose={() => !busy && onClose()}><form onSubmit={submit} className="space-y-4"><fieldset disabled={busy} className="space-y-4 disabled:opacity-70">{user?.role === 'admin' && !trip && <QueryState query={villages}><label className="block text-sm">Village *<select required className="theme-input mt-1 w-full" value={form.villageId} onChange={e => setForm({ ...form, villageId: e.target.value })}><option value="">Select village</option>{villages.data?.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}</select></label></QueryState>}{field('title', 'Trip title', 'text', true)}{field('destination', 'Destination', 'text', true)}{field('meetingPoint', 'Meeting point', 'text', true)}{field('departureAt', 'Departure (IST)', 'datetime-local', true)}{field('returnAt', 'Return (IST) — optional', 'datetime-local')}{field('estimatedCost', 'Estimated cost per person (₹) — optional', 'number')}<label className="block text-sm">Description<textarea className="theme-input mt-1 w-full" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><label className="block text-sm">Cover photo — optional<input type="file" accept="image/*" onChange={uploadCover} className="mt-2 block w-full text-sm" /></label>{form.coverUrl && <div><img className="h-24 rounded-xl object-cover" src={form.coverUrl} alt="Trip cover preview" /><Button variant="ghost" onClick={() => setForm({ ...form, coverUrl: '' })}>Remove photo</Button></div>}</fieldset>{error && <p role="alert" className="text-sm text-danger">{error}</p>}<Button type="submit" className="w-full min-h-11" disabled={busy || (user?.role === 'admin' && !trip && !form.villageId)}>{busy ? 'Saving…' : trip ? 'Save changes' : 'Publish trip'}</Button></form></Modal>;
}
export default function TripsPage() {
  const query = useGetTripsQuery();
  const user = useSelector(s => s.auth.user);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const trips = (query.data || []).filter(t => filter === 'all' || (filter === 'going' ? !!t.myParticipation : tripOpen(t)));
  return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="village-eyebrow">Go places, together</p><h1 className="village-display text-4xl">Village Trips</h1><p className="mt-2 text-text-muted">Plan a day out. Bring your family. Make memories.</p></div><Button disabled={user?.role !== 'admin' && !user?.villageId} onClick={() => setCreating(true)}>+ Plan a Trip</Button></div>{!user?.villageId && user?.role !== 'admin' && <Link className="block text-primary-text underline" to="/dashboard">Join a village from your dashboard to plan trips.</Link>}<div className="flex flex-wrap gap-2">{[['upcoming', 'Upcoming'], ['going', 'My confirmations'], ['all', 'All trips']].map(([value, label]) => <Button key={value} variant={filter === value ? 'primary' : 'secondary'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</Button>)}</div><QueryState query={query} empty={!trips.length} emptyText="No trips here yet. Plan the first outing for your village."><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{trips.map(t => <TripCard key={t._id} trip={t} />)}</div></QueryState>{creating && <TripForm onClose={() => setCreating(false)} />}</div>;
}
export function TripDetailPage() {
  const { id } = useParams();
  const query = useGetTripQuery(id);
  const trip = query.data;
  const participants = useGetTripParticipantsQuery(id, { skip: !trip?.canManage });
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [update, saving] = useUpdateTripMutation();
  const [error, setError] = useState('');
  async function cancel() {
    setError('');
    try { const saved = await update({ id, status: 'cancelled' }).unwrap(); saved.notificationWarning ? toast(saved.notificationWarning) : toast.success('Trip cancelled'); setCancelling(false); }
    catch (e) { setError(e?.data?.message || 'Could not cancel trip'); }
  }
  return <div className="space-y-5"><Link className="inline-block py-2 text-primary-text" to="/dashboard/trips">← All trips</Link><QueryState query={query}>{trip && <><article className="village-panel space-y-5 p-5 sm:p-8">{trip.coverUrl && <img className="max-h-72 w-full rounded-2xl object-cover" src={trip.coverUrl} alt={trip.destination} />}<p className="village-eyebrow">{trip.villageId?.name} · {trip.status}</p><h1 className="break-words text-3xl font-bold">{trip.title}</h1><p className="text-text-muted">Organized by {trip.organizer?.name || 'Village member'}</p><dl className="grid gap-5 sm:grid-cols-2">{[['Destination', trip.destination], ['Meeting point', trip.meetingPoint], ['Departure (IST)', tripDate(trip.departureAt)], ['Return (IST)', trip.returnAt ? tripDate(trip.returnAt) : 'Not specified'], ['Estimated cost / person', trip.estimatedCost == null ? 'Not specified' : `₹${trip.estimatedCost.toLocaleString('en-IN')}`], ['Confirmed people', trip.totalConfirmed]].map(([label, value]) => <div key={label}><dt className="text-sm text-text-subtle">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}</dl><p className="whitespace-pre-wrap break-words">{trip.description}</p><Participation trip={trip} />{trip.canManage && trip.status !== 'cancelled' && <div className="flex flex-wrap gap-3 border-t border-line pt-5"><Button variant="secondary" onClick={() => setEditing(true)}>Edit trip</Button><Button variant="danger" onClick={() => setCancelling(true)}>Cancel trip</Button></div>}</article>{trip.canManage && <section className="village-panel p-5"><h2 className="text-xl font-bold">Confirmed participants</h2><p className="mt-1 text-sm text-text-subtle">Visible only to the organizer and admin. Counts include accompanying family.</p><QueryState query={participants} empty={!participants.data?.length} emptyText="No confirmations yet."><ul className="mt-4 divide-y divide-line">{participants.data?.map(p => <li className="flex justify-between gap-4 py-3" key={p._id}><span>{p.name}</span><b>{p.partyCount} people</b></li>)}</ul></QueryState></section>}{editing && <TripForm trip={trip} onClose={() => setEditing(false)} />}{cancelling && <Modal title="Cancel this trip?" onClose={() => !saving.isLoading && setCancelling(false)}><p>Participants will be notified. Attendance history will be kept.</p>{error && <p role="alert" className="mt-3 text-danger">{error}</p>}<Button className="mt-5" variant="danger" disabled={saving.isLoading} onClick={cancel}>{saving.isLoading ? 'Cancelling…' : 'Cancel trip'}</Button></Modal>}</>}</QueryState></div>;
}
