import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
  useUploadFileMutation,
} from '../app/apiSlice';

export default function EventAdminPage() {
  const { data, refetch } = useGetEventsQuery();
  const [createEvent, { isLoading }] = useCreateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [upload] = useUploadFileMutation();
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    place: '',
    timing: '',
    lat: '',
    lng: '',
    bannerUrl: '',
  });

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'events');
    try {
      const res = await upload(fd).unwrap();
      setForm((f) => ({ ...f, bannerUrl: res.url }));
      toast.success('Banner uploaded');
    } catch (err) {
      toast.error(err?.data?.message || 'Upload failed');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await createEvent({
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        place: form.place,
        timing: form.timing,
        bannerUrl: form.bannerUrl,
        location:
          form.lat && form.lng
            ? { lat: Number(form.lat), lng: Number(form.lng) }
            : undefined,
      }).unwrap();
      toast.success('Event created');
      setForm({
        title: '',
        description: '',
        date: '',
        place: '',
        timing: '',
        lat: '',
        lng: '',
        bannerUrl: '',
      });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Manage events</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 max-w-lg">
        <input
          className="w-full border rounded px-3 py-2 dark:bg-slate-950"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full border rounded px-3 py-2 dark:bg-slate-950"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2 dark:bg-slate-950"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <input
          className="w-full border rounded px-3 py-2 dark:bg-slate-950"
          placeholder="Place"
          value={form.place}
          onChange={(e) => setForm({ ...form, place: e.target.value })}
        />
        <input
          className="w-full border rounded px-3 py-2 dark:bg-slate-950"
          placeholder="Timing label (e.g. 5 PM – 8 PM)"
          value={form.timing}
          onChange={(e) => setForm({ ...form, timing: e.target.value })}
        />
        <div className="flex gap-2">
          <input
            className="w-full border rounded px-3 py-2 dark:bg-slate-950"
            placeholder="Lat"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
          />
          <input
            className="w-full border rounded px-3 py-2 dark:bg-slate-950"
            placeholder="Lng"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Banner image</label>
          <input type="file" accept="image/*" onChange={onUpload} className="block mt-1 text-sm" />
          {form.bannerUrl && (
            <p className="text-xs text-slate-500 truncate mt-1">{form.bannerUrl}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-brand-600 text-white px-4 py-2 disabled:opacity-60"
        >
          Publish event
        </button>
      </form>
      <ul className="mt-10 space-y-2">
        {(data || []).map((e) => (
          <li key={e._id} className="flex justify-between items-center border rounded-lg px-3 py-2">
            <span>{e.title}</span>
            <button
              type="button"
              className="text-red-600 text-sm"
              onClick={async () => {
                if (!confirm('Delete?')) return;
                await deleteEvent(e._id).unwrap();
                refetch();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
