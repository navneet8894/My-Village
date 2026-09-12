import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { apiSlice, useGetFamilyQuery, useSetFamilyHeadMutation, useRemoveFamilyMemberMutation } from '../app/apiSlice';
import { Button } from '../shared/ui';
import FamilyTreeCanvas, { MemberAvatar } from '../components/FamilyTreeCanvas';
import FamilyMemberEditor, { FamilyDialog } from '../components/FamilyMemberEditor';
import { connectedFamily, familyMembers, layoutFamily, relationToHead } from '../utils/familyTree';
import '../styles/family-tree.css';

function MemberDetails({ member, members, onClose, onEdit, onLink }) {
  const name = id => members.find(person => person.id === id)?.displayName || 'Not selected';
  const children = members.filter(person => person.parentIds.includes(member.id));
  const details = [
    ['Date of birth', member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('en-IN', { timeZone: 'UTC' }) : 'Not specified'],
    ['Gender', member.gender || 'Not specified'],
    ['Phone', member.phone || 'Not specified'],
    ['Occupation', member.occupation || 'Not specified'],
    ['Linked account email', member.userId?.email || 'No registered account linked'],
    ['Parents', member.parentIds.length ? member.parentIds.map(name).join(' · ') : 'Not selected'],
    ['Spouse / partner', member.spouseId ? name(member.spouseId) : 'Not selected'],
    ['Children', children.length ? children.map(person => person.displayName).join(' · ') : 'No children linked'],
  ];
  return <FamilyDialog title="Member details" onClose={onClose}>
    <div className="ft-dialog-body">
      <div className="mb-6 flex items-center gap-4"><MemberAvatar member={member} /><div><h3 translate="no" className="break-words text-xl font-bold">{member.displayName}</h3>{member.isHead && <p className="mt-1 text-xs font-semibold text-primary-text">Family head</p>}</div></div>
      <dl className="grid gap-5 sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-xs text-text-subtle">{label}</dt><dd className="mt-1 break-words text-sm font-medium" translate="no">{value}</dd></div>)}</dl>
    </div>
    <div className="ft-dialog-footer"><Button variant="secondary" onClick={() => onLink(member)}>Link family</Button><Button onClick={() => onEdit(member)}>Edit details</Button></div>
  </FamilyDialog>;
}

export default function FamilyPage() {
  const currentUser = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const query = useGetFamilyQuery();
  const [setHead, settingHead] = useSetFamilyHeadMutation();
  const [removeMember, removing] = useRemoveFamilyMemberMutation();
  const [view, setView] = useState('tree');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [removeId, setRemoveId] = useState(null);
  const [actionError, setActionError] = useState('');
  const actionLock = useRef(false);
  const busy = settingHead.isLoading || removing.isLoading;
  const members = useMemo(() => familyMembers(query.data?.family), [query.data?.family]);
  const head = members.find(member => member.isHead);
  const connected = useMemo(() => connectedFamily(members, head?.id), [members, head?.id]);
  const generationCount = useMemo(() => layoutFamily(members).generations, [members]);
  const needingHelp = members.filter(member => member.needsRelationshipReview || (members.length > 1 && !connected.has(member.id)));
  const detailedMember = members.find(member => member.id === detailId);
  const removingMember = members.find(member => member.id === removeId);
  const filtered = members.filter(member => member.displayName?.toLowerCase().includes(search.toLowerCase()));

  function edit(member, tab = 'details') {
    setDetailId(null);
    setEditor({ member, tab });
  }
  async function updateHead(member) {
    if (actionLock.current) return;
    actionLock.current = true;
    try {
      const result = await setHead({ memberId: member.id }).unwrap();
      await dispatch(apiSlice.util.upsertQueryData('getFamily', undefined, result));
      toast.success('Family head updated. Relationships kept unchanged.');
    } catch (error) { toast.error(error?.data?.message || 'Could not change family head'); }
    finally { actionLock.current = false; }
  }
  async function remove() {
    if (actionLock.current || !removeId) return;
    actionLock.current = true; setActionError('');
    try {
      const result = await removeMember(removeId).unwrap();
      await dispatch(apiSlice.util.upsertQueryData('getFamily', undefined, result));
      setRemoveId(null); toast.success('Member removed. Other family members have been kept.');
    } catch (error) { setActionError(error?.data?.message || 'Could not remove this member'); }
    finally { actionLock.current = false; }
  }

  if (query.isLoading) return <div className="village-panel p-10 text-center text-text-subtle" role="status">Loading your family…</div>;
  if (query.isError) return <div className="village-panel p-8"><h1 className="text-xl font-bold">Could not load your family</h1><p className="my-4 text-text-muted">{query.error?.data?.message || 'Please try again.'}</p><Button onClick={query.refetch}>Retry</Button></div>;

  return <div className="ft-page">
    <header className="ft-intro">
      <div><p className="ft-eyebrow">Our roots. Our people.</p><h1 className="village-display text-4xl sm:text-5xl">My Family Tree</h1><p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">Every generation has a story. Bring yours together, one connection at a time.</p>
        <div className="ft-stats"><span><b>{members.length}</b>Members</span><span><b>{generationCount}</b>Generations</span><span><b>{needingHelp.length}</b>To connect / review</span></div>
      </div>
      <Button className="min-h-11" onClick={() => setEditor({ member: null, tab: 'details' })}>+ Add family member</Button>
    </header>

    {needingHelp.length > 0 && <section className="ft-notice">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Connect your family members</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">Choose <b>Link family</b> beside a name, select that person's parents or spouse, and save. The tree will connect them automatically.</p><p className="mt-2 text-xs text-text-subtle">For a child, select their parents. For a couple, select the spouse on either person. Add missing people first.</p></div></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{needingHelp.map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-3"><div className="min-w-0"><p className="break-words text-sm font-bold" translate="no">{member.displayName}</p><p className="mt-1 text-xs text-text-subtle">{member.needsRelationshipReview ? 'Relationship needs review' : 'Not connected to the head’s branch'}</p></div><Button variant="secondary" onClick={() => edit(member, 'relationships')}>Link family →</Button></div>)}</div>
    </section>}

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="ft-view-tabs" aria-label="Family view"><button aria-pressed={view === 'tree'} onClick={() => setView('tree')}>Family tree</button><button aria-pressed={view === 'list'} onClick={() => setView('list')}>Member list</button></div>
      <span className="text-xs text-text-subtle" role="status">{query.isFetching ? 'Updating family…' : 'Your family details are private to your account'}</span>
    </div>
    {view === 'tree' ? <FamilyTreeCanvas members={members} head={head} onDetails={member => setDetailId(member.id)} onEdit={member => edit(member)} onLink={member => edit(member, 'relationships')} /> : <section className="village-panel p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Manage family members</h2><input aria-label="Search family members" className="theme-input sm:max-w-xs" placeholder="Search by name…" value={search} onChange={event => setSearch(event.target.value)} /></div>
      <div className="space-y-3">{filtered.map(member => <article className="ft-member-row" key={member.id}>
        <div className="flex min-w-0 items-center gap-3"><MemberAvatar member={member} /><div className="min-w-0"><button onClick={() => setDetailId(member.id)} className="break-words text-start text-sm font-bold" translate="no">{member.displayName}</button><p className="mt-1 text-xs text-text-subtle">{relationToHead(member, head, members)}</p></div></div>
        <div className="ft-member-row-actions"><Button variant="secondary" onClick={() => edit(member)}>Edit details</Button><Button variant="secondary" onClick={() => edit(member, 'relationships')}>Link family</Button>{!member.isHead && <Button disabled={busy} variant="ghost" onClick={() => updateHead(member)}>Make head</Button>}{!member.isHead && String(member.userId?._id || member.userId) !== String(currentUser?._id) && <Button variant="danger" disabled={busy} onClick={() => { setActionError(''); setRemoveId(member.id); }}>Remove</Button>}</div>
      </article>)}</div>{!filtered.length && <p className="py-8 text-center text-text-subtle">No matching members.</p>}
    </section>}
    {view === 'tree' && <p className="text-xs text-text-subtle">Use <b>Member list</b> to change the family head or remove a member. Every tree card also has Edit details and Link family.</p>}

    {editor && <FamilyMemberEditor key={editor.member?.id || 'new'} member={editor.member} members={members} initialTab={editor.tab} onClose={() => setEditor(null)} />}
    {detailedMember && !editor && <MemberDetails member={detailedMember} members={members} onClose={() => setDetailId(null)} onEdit={member => edit(member)} onLink={member => edit(member, 'relationships')} />}
    {removingMember && <FamilyDialog title="Remove family member?" busy={busy} onClose={() => setRemoveId(null)}><div className="ft-dialog-body"><p>Remove <b translate="no">{removingMember.displayName}</b> and their connections? Their children and all other family members will remain in your family.</p>{actionError && <p role="alert" className="mt-4 text-danger">{actionError}</p>}</div><div className="ft-dialog-footer"><Button variant="secondary" disabled={busy} onClick={() => setRemoveId(null)}>Keep member</Button><Button variant="danger" disabled={busy} onClick={remove}>{busy ? 'Removing…' : 'Remove member'}</Button></div></FamilyDialog>}
  </div>;
}

