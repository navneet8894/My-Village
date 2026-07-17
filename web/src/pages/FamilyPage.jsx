import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGetFamilyQuery, useAddFamilyMemberMutation } from '../app/apiSlice';

function TreeNode({ node, depth = 0 }) {
  if (!node) return null;
  return (
    <li className="relative">
      <div
        className="inline-flex flex-col rounded-lg border border-line bg-card px-3 py-2 shadow-sm"
        style={{ marginLeft: depth * 12 }}
      >
        <span className="font-medium">{node.displayName}</span>
        <span className="text-xs text-text-subtle">{node.relationshipToHead}</span>
        {node.isHead && (
          <span className="text-xs text-primary font-semibold mt-1">Family head</span>
        )}
      </div>
      {node.children?.length > 0 && (
        <ul className="mt-2 ml-4 border-l border-line pl-4 space-y-2">
          {node.children.map((ch) => (
            <TreeNode key={ch.id} node={ch} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function AddMemberForm({ onDone }) {
  const [email, setEmail] = useState('');
  const [relationship, setRel] = useState('child');
  const [addMember, { isLoading }] = useAddFamilyMemberMutation();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await addMember({ email, relationshipToHead: relationship }).unwrap();
      toast.success('Member added');
      setEmail('');
      onDone();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 max-w-md space-y-3 rounded-xl border border-line p-4 bg-card"
    >
      <h2 className="font-semibold">Add member by email</h2>
      <p className="text-xs text-text-subtle">
        The person must already be registered. Set the family head from your profile tools when
        needed.
      </p>
      <input
        className="theme-input"
        placeholder="Registered user email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select
        className="theme-input"
        value={relationship}
        onChange={(e) => setRel(e.target.value)}
      >
        {['spouse', 'child', 'parent', 'sibling', 'other'].map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-primary text-primary-contrast px-4 py-2 text-sm disabled:opacity-60"
      >
        Add
      </button>
    </form>
  );
}

export default function FamilyPage() {
  const { data, isLoading, refetch } = useGetFamilyQuery();

  if (isLoading) return <p>Loading family…</p>;
  const tree = data?.tree;

  return (
    <div>
      <h1 className="text-2xl font-bold">Family</h1>
      <p className="text-text-subtle text-sm mt-1">
        Tree is built from the family head and parent links on each member.
      </p>
      <div className="mt-6 rounded-xl border border-line p-4 bg-card overflow-x-auto">
        {tree?.root ? (
          <ul className="space-y-2">
            <TreeNode node={tree.root} />
          </ul>
        ) : (
          <p className="text-text-subtle">No head defined yet.</p>
        )}
        {tree?.orphans?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-text-muted">Other members</p>
            <ul className="mt-2 space-y-2">
              {tree.orphans.map((o) => (
                <TreeNode key={o.id} node={o} />
              ))}
            </ul>
          </div>
        )}
      </div>
      <AddMemberForm onDone={() => refetch()} />
    </div>
  );
}
