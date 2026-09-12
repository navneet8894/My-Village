import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useConfirmTripMutation, useLeaveTripMutation } from '../app/apiSlice';
import { Button } from '../shared/ui';

export const tripDate = value => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const tripOpen = trip => trip.status === 'active' && new Date(trip.departureAt) > new Date();
export function QueryState({ query, children, empty, emptyText = 'Nothing here yet.' }) {
  if (query.isLoading) return <p role="status" className="p-5 text-text-subtle">Loading…</p>;
  if (query.isError) return <div role="alert" className="p-5"><p className="mb-3 text-danger">{query.error?.data?.message || 'Could not load this information.'}</p><Button variant="secondary" onClick={query.refetch}>Retry</Button></div>;
  if (empty) return <p className="p-5 text-text-subtle">{emptyText}</p>;
  return children;
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current.showModal();
    return () => { previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }} className="village-dialog w-[calc(100%_-_2rem)] max-w-lg rounded-3xl border border-line bg-card p-6 text-text shadow-xl backdrop:bg-black/50"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{title}</h2><Button variant="ghost" aria-label="Close dialog" onClick={onClose}>✕</Button></div>{children}</dialog>;
}
export function Participation({ trip }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(trip.myParticipation?.additionalFamilyCount ?? 0);
  const [error, setError] = useState('');
  const [confirm, saving] = useConfirmTripMutation();
  const [leave, leaving] = useLeaveTripMutation();
  const busy = saving.isLoading || leaving.isLoading;
  async function submit(cancel = false) {
    setError('');
    try {
      if (cancel) await leave(trip._id).unwrap();
      else await confirm({ id: trip._id, additionalFamilyCount: Number(count) }).unwrap();
      toast.success(cancel ? 'Confirmation cancelled' : 'Participation confirmed');
      setOpen(false);
    } catch (e) { setError(e?.data?.message || 'Could not save. Please try again.'); }
  }
  if (!tripOpen(trip)) return <p className="text-sm text-text-subtle">{trip.status === 'cancelled' ? 'Trip cancelled' : 'Confirmations closed'}{trip.myParticipation ? ` · Your party: ${1 + trip.myParticipation.additionalFamilyCount}` : ''}</p>;
  if (trip.canParticipate === false) return <p className="text-sm text-text-subtle">Participation is for members of this village.</p>;
  return <><Button className="min-h-11" onClick={() => { setCount(trip.myParticipation?.additionalFamilyCount ?? 0); setError(''); setOpen(true); }}>{trip.myParticipation ? `Going (${1 + trip.myParticipation.additionalFamilyCount}) · Update` : 'Main chalunga'}</Button>{open && <Modal title="Confirm your participation" onClose={() => !busy && setOpen(false)}><form onSubmit={e => { e.preventDefault(); submit(); }}><p className="font-semibold">{trip.title}</p><p className="mt-4">Aap: 1</p><label className="mt-4 block text-sm">Saath jaane wale family members<input autoFocus required type="number" min="0" step="1" value={count} onChange={e => setCount(e.target.value)} className="theme-input mt-2 w-full" /></label><p className="mt-3 font-bold">Total: {1 + Number(count || 0)} people</p><p className="mt-2 text-xs text-text-subtle">Included family members should not confirm separately.</p>{error && <p role="alert" className="mt-3 text-danger">{error}</p>}<div className="mt-5 flex flex-wrap gap-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Confirm'}</Button>{trip.myParticipation && <Button variant="danger" disabled={busy} onClick={() => submit(true)}>Cancel my confirmation</Button>}</div></form></Modal>}</>;
}
export function TripCard({ trip }) {
  return <article className="overflow-hidden rounded-3xl border border-line bg-card"><div className="flex h-28 items-center justify-between bg-primary-muted px-6 text-primary-text">{trip.coverUrl ? <img src={trip.coverUrl} alt={trip.destination} loading="lazy" className="h-full w-full object-cover" /> : <><span className="text-4xl" aria-hidden="true">↗</span><span className="text-xs font-bold uppercase tracking-widest">Explore together</span></>}</div><div className="space-y-3 p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#b44d2c] dark:text-orange-300">{trip.villageId?.name || 'Village trip'} · {trip.status}</p><h3 className="break-words text-xl font-bold"><Link to={`/dashboard/trips/${trip._id}`}>{trip.title}</Link></h3><p className="break-words text-sm text-text-muted">{trip.destination}</p><p className="text-sm">{tripDate(trip.departureAt)} IST</p><p className="text-xs text-text-subtle">Organized by {trip.organizer?.name || 'Village member'}</p><div className="flex flex-wrap justify-between gap-2 border-t border-line pt-3 text-sm"><b>{trip.totalConfirmed} people going</b>{trip.estimatedCost != null && <span>₹{trip.estimatedCost.toLocaleString('en-IN')} / person</span>}</div><div className="flex flex-wrap items-center gap-3"><Participation trip={trip} /><Link className="py-3 text-sm font-semibold text-primary-text" to={`/dashboard/trips/${trip._id}`}>View details →</Link></div></div></article>;
}
