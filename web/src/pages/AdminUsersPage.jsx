import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../shared/ui';
import {
  useAdminUsersQuery,
  useAdminBanMutation,
  useAdminUnbanMutation,
} from '../app/apiSlice';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const { data: users, refetch, isLoading } = useAdminUsersQuery();
  const [ban] = useAdminBanMutation();
  const [unban] = useAdminUnbanMutation();
  const [selected, setSelected] = useState(null);

  if (isLoading) {
    return <p className="text-text-subtle">Loading users…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/dashboard/admin" className="text-sm text-primary hover:underline">
            ← Back to admin dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-1">All users</h1>
          <p className="text-text-subtle text-sm mt-1">
            {users?.length || 0} registered accounts
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader className="hidden sm:table-cell">Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader className="hidden md:table-cell">Status</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {(users || []).map((u) => (
                <TableRow
                  key={u._id}
                  onClick={() => setSelected(u)}
                  className={`cursor-pointer ${
                    selected?._id === u._id ? 'bg-primary-muted' : ''
                  }`}
                >
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="hidden text-text-subtle sm:table-cell">{u.email}</TableCell>
                  <TableCell><Badge variant={u.role === 'admin' ? 'primary' : 'default'}>{u.role}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u.isBanned ? (
                      <span className="text-danger text-xs font-medium">Banned</span>
                    ) : u.isEmailVerified ? (
                      <span className="text-primary text-xs font-medium">Verified</span>
                    ) : (
                      <span className="text-warning text-xs font-medium">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Card className="h-fit p-5">
          {selected ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">{selected.name}</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-text-subtle">Email</dt>
                  <dd className="font-medium break-all">{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Phone</dt>
                  <dd>{selected.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Role</dt>
                  <dd className="capitalize">{selected.role}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Village</dt>
                  <dd>
                    {selected.villageLocation?.village
                      ? `${selected.villageLocation.village}, ${selected.villageLocation.district}, ${selected.villageLocation.state}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Address</dt>
                  <dd>{selected.address || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Bio</dt>
                  <dd>{selected.bio || '—'}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Email verified</dt>
                  <dd>{selected.isEmailVerified ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Joined</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                </div>
                {selected.isBanned && (
                  <div>
                    <dt className="text-text-subtle">Ban reason</dt>
                    <dd className="text-danger">{selected.banReason || '—'}</dd>
                  </div>
                )}
              </dl>
              <div className="pt-2 border-t border-line">
                {!selected.isBanned ? (
                  <Button
                    type="button"
                    variant="danger" className="w-full"
                    onClick={async () => {
                      try {
                        await ban({ id: selected._id, reason: 'Moderation' }).unwrap();
                        toast.success('User banned');
                        refetch();
                        setSelected({ ...selected, isBanned: true, banReason: 'Moderation' });
                      } catch (err) {
                        toast.error(err?.data?.message || 'Failed');
                      }
                    }}
                  >
                    Ban user
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={async () => {
                      try {
                        await unban(selected._id).unwrap();
                        toast.success('User unbanned');
                        refetch();
                        setSelected({ ...selected, isBanned: false, banReason: '' });
                      } catch (err) {
                        toast.error(err?.data?.message || 'Failed');
                      }
                    }}
                  >
                    Unban user
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-text-subtle text-sm text-center py-8">
              Select a user from the list to view details
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
