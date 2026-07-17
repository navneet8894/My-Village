import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useGetMeQuery, useUpdateMeMutation, useUploadFileMutation } from '../app/apiSlice';
import { useDispatch } from 'react-redux';
import { setUser } from '../features/auth/authSlice';

export default function ProfilePage() {
  const { data, refetch } = useGetMeQuery();
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const [upload] = useUploadFileMutation();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: '', phone: '', bio: '', address: '' });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        address: data.address || '',
      });
      dispatch(setUser(data));
    }
  }, [data, dispatch]);

  async function onAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'avatars');
    try {
      const res = await upload(fd).unwrap();
      const u = await updateMe({ avatar: res.url }).unwrap();
      dispatch(setUser(u));
      toast.success('Avatar updated');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const u = await updateMe(form).unwrap();
      dispatch(setUser(u));
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="mt-4 flex items-center gap-4">
        {data?.avatar ? (
          <img src={data.avatar} alt="" className="h-20 w-20 rounded-full object-cover border" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-soft" />
        )}
        <label className="text-sm text-primary cursor-pointer">
          Change photo
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
      </div>
      <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-3">
        {['name', 'phone', 'bio', 'address'].map((f) => (
          <div key={f}>
            <label className="text-sm font-medium capitalize">{f}</label>
            {f === 'bio' || f === 'address' ? (
              <textarea
                className="theme-input"
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            ) : (
              <input
                className="theme-input"
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary text-primary-contrast px-4 py-2 disabled:opacity-60"
        >
          Save
        </button>
      </form>
    </div>
  );
}
