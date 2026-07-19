import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAdminUpdateVillageLocationMutation, useAdminVillageDetailQuery } from '../app/apiSlice';
import VillageMap from '../components/VillageMap';

export default function AdminVillageDetailPage() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useAdminVillageDetailQuery(id);
  const [updateLocation, { isLoading: isSaving }] = useAdminUpdateVillageLocationMutation();
  const [center, setCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  useEffect(() => { if (data?.village) { const lat = Number(data.village.lat); const lng = Number(data.village.lng); if (Number.isFinite(lat) && Number.isFinite(lng)) setCenter({ lat, lng }); } }, [data?.village]);

  if (isLoading) return <p className="text-text-subtle">Loading…</p>;
  if (!data?.village) return <p>Village not found.</p>;

  const { village, users, posts, events } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/dashboard/admin/villages" className="text-sm text-primary hover:underline">
          ← All villages
        </Link>
        <h1 className="text-2xl font-bold mt-1">{village.name}</h1>
        <p className="text-text-subtle">
          {village.district}, {village.state}, {village.country}
        </p>
        {village.formattedAddress && (
          <p className="text-xs text-text-subtle mt-1">{village.formattedAddress}</p>
        )}
      </div>

      <section className="rounded-xl border border-line bg-card p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Village map location</h2><p className="mt-1 text-xs text-text-subtle">Drag the orange marker to the exact village centre, then save it.</p></div><button disabled={isSaving} onClick={async () => { try { await updateLocation({ id, ...center }).unwrap(); toast.success('Village location saved'); refetch(); } catch (err) { toast.error(err?.data?.message || 'Could not save location'); } }} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-contrast disabled:opacity-60">{isSaving ? 'Saving…' : 'Save location'}</button></div>
        <VillageMap center={center} villageName={village.name} events={events || []} draggable onCenterChange={setCenter} height={430} />
        <div className="mt-3 flex gap-4 font-mono text-xs text-text-subtle"><span>Lat: {center.lat}</span><span>Lng: {center.lng}</span></div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Users ({users?.length || 0})</h2>
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {(users || []).map((u) => (
            <li key={u._id} className="px-4 py-3 flex justify-between text-sm">
              <span className="font-medium">{u.name}</span>
              <span className="text-text-subtle">{u.email}</span>
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
              className="rounded-lg border border-line px-4 py-3 text-sm"
            >
              <span className="font-medium">{p.userId?.name}</span>
              <span className="text-text-subtle mx-2">·</span>
              <span className="text-text-muted">
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
              className="rounded-lg border border-line px-4 py-3 text-sm"
            >
              <span className="font-medium">{e.title}</span>
              <span className="text-text-subtle mx-2">·</span>
              <span className="text-text-subtle">{new Date(e.date).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
