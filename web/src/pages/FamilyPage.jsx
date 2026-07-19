import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useGetFamilyQuery, useAddFamilyMemberMutation, useSetFamilyHeadMutation, useRemoveFamilyMemberMutation } from '../app/apiSlice';

const relations = [
  ['spouse', 'Spouse'], ['son', 'Son'], ['daughter', 'Daughter'], ['father', 'Father'],
  ['mother', 'Mother'], ['brother', 'Brother'], ['sister', 'Sister'],
  ['grandfather', 'Grandfather'], ['grandmother', 'Grandmother'], ['grandson', 'Grandson'],
  ['granddaughter', 'Granddaughter'], ['other', 'Other'],
];
const relationLabel = (value) => relations.find(([key]) => key === value)?.[1] || (value === 'self' ? 'Self' : value || 'Member');

function PersonCard({ node }) {
  const initials = node.displayName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return <div className={`family-person ${node.isHead ? 'family-head' : ''}`}>
    <span className="family-avatar">{initials}</span>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold">{node.displayName}</h3>{node.isHead && <span className="head-badge">Family Head</span>}</div><p className="mt-0.5 text-xs font-medium capitalize text-[#c46645] dark:text-primary-text">{relationLabel(node.relationshipToHead)}</p>{(node.occupation || node.phone) && <p className="mt-1 truncate text-[11px] text-text-subtle">{[node.occupation, node.phone].filter(Boolean).join(' · ')}</p>}</div>
  </div>;
}

function TreeBranch({ node }) {
  if (!node) return null;
  return <li className="family-branch"><PersonCard node={node} />{node.children?.length > 0 && <ul className="family-children">{node.children.map((child) => <TreeBranch key={child.id} node={child} />)}</ul>}</li>;
}

function AddMemberForm({ members, onDone }) {
  const [form, setForm] = useState({ displayName: '', email: '', dateOfBirth: '', gender: '', phone: '', occupation: '', relationshipToHead: 'son', parentMemberId: '', isHead: false });
  const [addMember, { isLoading }] = useAddFamilyMemberMutation();
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.isHead && !form.parentMemberId) return toast.error('Please select who this member is related to');
    try {
      await addMember({ ...form, email: form.email || undefined, dateOfBirth: form.dateOfBirth || undefined, parentMemberId: form.isHead ? undefined : form.parentMemberId }).unwrap();
      toast.success(form.isHead ? 'Member added as family head' : 'Family member added');
      setForm({ displayName: '', email: '', dateOfBirth: '', gender: '', phone: '', occupation: '', relationshipToHead: 'son', parentMemberId: '', isHead: false });
      onDone();
    } catch (err) { toast.error(err?.data?.message || 'Could not add family member'); }
  }
  return <form onSubmit={onSubmit} className="village-panel p-5 sm:p-6">
    <div><h2 className="village-display text-2xl">Add Family Member</h2><p className="mt-1 text-xs text-text-subtle">Add their details and connect them to someone already in your family.</p></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="family-field"><span>Full name *</span><input required className="theme-input" placeholder="e.g. Raj Kumar" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} /></label>
      <label className="family-field"><span>Registered email</span><input type="email" className="theme-input" placeholder="Optional" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
      <label className="family-field"><span>Relation *</span><select className="theme-input capitalize" value={form.relationshipToHead} onChange={(e) => update('relationshipToHead', e.target.value)}>{relations.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="family-field"><span>Related to *</span><select disabled={form.isHead} required={!form.isHead} className="theme-input" value={form.parentMemberId} onChange={(e) => update('parentMemberId', e.target.value)}><option value="">Select family member</option>{members.map((m) => <option value={m._id} key={m._id}>{m.displayName}</option>)}</select></label>
      <label className="family-field"><span>Date of birth</span><input type="date" className="theme-input" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} /></label>
      <label className="family-field"><span>Gender</span><select className="theme-input" value={form.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
      <label className="family-field"><span>Phone</span><input className="theme-input" placeholder="Optional" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
      <label className="family-field"><span>Occupation</span><input className="theme-input" placeholder="Optional" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} /></label>
    </div>
    <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#eadfd4] bg-[#fffaf4] p-4 dark:border-line dark:bg-soft"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#df6744]" checked={form.isHead} onChange={(e) => update('isHead', e.target.checked)} /><span><b className="block text-sm">Make this person family head</b><small className="text-text-subtle">Only one head is allowed. This will replace the current family head.</small></span></label>
    <button disabled={isLoading} className="mt-5 rounded-xl bg-[#df6744] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#ca5536] disabled:opacity-60">{isLoading ? 'Adding…' : 'Add member'}</button>
  </form>;
}

export default function FamilyPage() {
  const currentUser = useSelector((s) => s.auth.user);
  const { data, isLoading, refetch } = useGetFamilyQuery();
  const [setHead, { isLoading: changingHead }] = useSetFamilyHeadMutation();
  const [removeMember] = useRemoveFamilyMemberMutation();
  if (isLoading) return <div className="py-20 text-center text-text-subtle">Loading family…</div>;
  const members = data?.family?.members || [];
  const tree = data?.tree;
  const changeHead = async (memberId) => { try { await setHead({ memberId }).unwrap(); toast.success('Family head updated'); refetch(); } catch (err) { toast.error(err?.data?.message || 'Could not change family head'); } };
  const remove = async (memberId) => { if (!window.confirm('Remove this person from your family?')) return; try { await removeMember(memberId).unwrap(); toast.success('Member removed'); refetch(); } catch (err) { toast.error(err?.data?.message || 'Cannot remove member'); } };
  return <div className="family-page">
    <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#dc704f]">My family</p><h1 className="village-display mt-1 text-4xl">Family Tree</h1><p className="mt-2 max-w-2xl text-sm text-text-subtle">Add relations, connect each person to a family member and choose one person as the head of the family.</p></div>
    <section className="village-panel mt-7 overflow-x-auto p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="font-bold">Family structure</h2><span className="rounded-full bg-[#eaf1ec] px-3 py-1 text-xs font-bold text-[#42634f]">{members.length} {members.length === 1 ? 'member' : 'members'}</span></div>{tree?.root ? <ul className="family-tree"><TreeBranch node={tree.root} /></ul> : <p className="py-10 text-center text-text-subtle">No family head selected.</p>}{tree?.orphans?.length > 0 && <div className="mt-8 border-t border-line pt-5"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-subtle">Unlinked members</p><div className="grid gap-3 md:grid-cols-2">{tree.orphans.map((node) => <PersonCard node={node} key={node.id} />)}</div></div>}</section>
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,.7fr)]"><AddMemberForm members={members} onDone={refetch} /><section className="village-panel p-5"><h2 className="village-display text-2xl">Manage Members</h2><p className="mt-1 text-xs text-text-subtle">Change the head or remove a member.</p><div className="mt-5 space-y-3">{members.map((m) => <div className="rounded-2xl border border-[#eee5dc] p-3 dark:border-line" key={m._id}><div className="flex items-center gap-3"><span className="family-avatar">{m.displayName?.charAt(0)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{m.displayName}</p><p className="text-[11px] capitalize text-text-subtle">{relationLabel(m.relationshipToHead)}{m.isHead ? ' · Family head' : ''}</p></div></div><div className="mt-3 flex justify-end gap-3 border-t border-line pt-2">{!m.isHead && <button disabled={changingHead} className="text-xs font-bold text-[#397057] disabled:opacity-50" onClick={() => changeHead(m._id)}>Make head</button>}{!m.isHead && String(m.userId?._id || m.userId) !== String(currentUser?._id) && <button className="text-xs font-bold text-danger" onClick={() => remove(m._id)}>Remove</button>}</div></div>)}</div></section></div>
  </div>;
}
