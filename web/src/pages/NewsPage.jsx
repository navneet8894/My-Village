import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetNewsQuery,
  useCreateNewsMutation,
  useDeleteNewsMutation,
  useUploadFileMutation,
} from '../app/apiSlice';

export default function NewsPage() {
  const { data, refetch } = useGetNewsQuery();
  const [createNews, { isLoading }] = useCreateNewsMutation();
  const [deleteNews] = useDeleteNewsMutation();
  const [upload] = useUploadFileMutation();
  const [kind, setKind] = useState('text');
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  async function onMedia(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'news');
    try {
      const res = await upload(fd).unwrap();
      setMediaUrl(res.url);
      if (file.type.startsWith('video/')) setKind('video');
      else if (file.type.startsWith('image/')) setKind('photo');
      else if (file.type.startsWith('audio/')) setKind('voice');
      toast.success('Uploaded');
    } catch (err) {
      toast.error(err?.data?.message || 'Upload failed');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await createNews({
        kind,
        text,
        mediaUrl,
      }).unwrap();
      toast.success('Posted');
      setText('');
      setMediaUrl('');
      setKind('text');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Village news</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3 max-w-lg rounded-xl border border-line bg-card p-4">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="theme-input"
        >
          <option value="text">Text</option>
          <option value="photo">Photo</option>
          <option value="video">Video</option>
          <option value="voice">Voice</option>
        </select>
        <textarea
          className="theme-input"
          placeholder="Caption or message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input type="file" onChange={onMedia} />
        {mediaUrl && <p className="text-xs truncate text-text-subtle">{mediaUrl}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary text-primary-contrast px-4 py-2 disabled:opacity-60"
        >
          Post
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {(data || []).map((n) => (
          <article key={n._id} className="rounded-xl border border-line p-4 bg-card">
            <div className="text-sm text-text-subtle">
              {n.userId?.name} · {new Date(n.createdAt).toLocaleString()}
            </div>
            {n.kind === 'text' && <p className="mt-2">{n.text}</p>}
            {n.kind === 'photo' && n.mediaUrl && (
              <img src={n.mediaUrl} alt="" className="mt-2 rounded-lg max-h-64 object-cover" />
            )}
            {n.kind === 'video' && n.mediaUrl && (
              <video src={n.mediaUrl} controls className="mt-2 w-full rounded-lg max-h-64" />
            )}
            {n.kind === 'voice' && n.mediaUrl && <audio src={n.mediaUrl} controls className="mt-2 w-full" />}
            <button
              type="button"
              className="mt-2 text-sm text-danger"
              onClick={async () => {
                await deleteNews(n._id).unwrap();
                refetch();
              }}
            >
              Remove
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
