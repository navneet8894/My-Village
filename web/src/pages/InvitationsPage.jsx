import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useUploadFileMutation,
} from '../app/apiSlice';

export default function InvitationsPage() {
  const { data, refetch } = useGetInvitationsQuery();
  const [createInvitation, { isLoading }] = useCreateInvitationMutation();
  const [upload] = useUploadFileMutation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState([]);

  async function onFiles(e) {
    const files = [...(e.target.files || [])];
    const next = [...media];
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'invitations');
      try {
        const res = await upload(fd).unwrap();
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        next.push({ url: res.url, type: type === 'video' ? 'video' : 'image' });
      } catch (err) {
        toast.error(err?.data?.message || 'Upload failed');
      }
    }
    setMedia(next);
    toast.success('Media attached');
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await createInvitation({ title, message, inviteAllVillagers: true, media }).unwrap();
      toast.success('Invitation sent to villagers');
      setTitle('');
      setMessage('');
      setMedia([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Personal invitations</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3 max-w-lg border border-line rounded-xl p-4 bg-card">
        <input
          className="theme-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="theme-input"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input type="file" multiple accept="image/*,video/*" onChange={onFiles} />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary text-primary-contrast px-4 py-2 disabled:opacity-60"
        >
          Invite all villagers
        </button>
      </form>
      <div className="mt-8 space-y-4">
        {(data || []).map((inv) => (
          <article key={inv._id} className="rounded-xl border border-line bg-card p-4">
            <h3 className="font-semibold">{inv.title}</h3>
            <p className="text-sm text-text-subtle">{inv.userId?.name}</p>
            <p className="mt-2 text-sm">{inv.message}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(inv.media || []).map((m, i) => (
                <img key={i} src={m.url} alt="" className="h-20 rounded object-cover" />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
