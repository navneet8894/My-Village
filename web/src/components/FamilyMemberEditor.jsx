import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { apiSlice, useAddFamilyMemberMutation, useUpdateFamilyMemberMutation } from '../app/apiSlice';
import { Button } from '../shared/ui';
import { descendantsOf } from '../utils/familyTree';

export function FamilyDialog({ title, onClose, busy = false, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return <dialog className="ft-dialog" ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><div className="ft-dialog-header"><h2 className="text-xl font-bold">{title}</h2><Button aria-label="Close dialog" variant="ghost" disabled={busy} onClick={onClose}>✕</Button></div>{children}</dialog>;
}

const dateInput = value => value ? String(value).slice(0, 10) : '';

export default function FamilyMemberEditor({ member, members, initialTab = 'details', onClose }) {
  const editing = Boolean(member);
  const dispatch = useDispatch();
  const [tab, setTab] = useState(initialTab);
  const [relationshipsChanged, setRelationshipsChanged] = useState(!editing || initialTab === 'relationships');
  const [form, setForm] = useState({
    displayName: member?.displayName || '', dateOfBirth: dateInput(member?.dateOfBirth),
    gender: member?.gender || '', phone: member?.phone || '', occupation: member?.occupation || '',
    email: '', parent1: member?.parentIds?.[0] || '', parent2: member?.parentIds?.[1] || '',
    spouseId: member?.spouseId || '', isHead: false,
  });
  const [error, setError] = useState('');
  const [addMember, adding] = useAddFamilyMemberMutation();
  const [updateMember, updating] = useUpdateFamilyMemberMutation();
  const submitting = useRef(false);
  const busy = adding.isLoading || updating.isLoading;
  const update = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    if (['parent1', 'parent2', 'spouseId'].includes(key)) setRelationshipsChanged(true);
  };
  const descendants = member ? descendantsOf(members, member.id) : new Set();
  const options = members.filter(person => person.id !== member?.id);
  const blockedSpouses = new Set();
  const ancestors = new Set();
  const collectAncestors = id => {
    if (ancestors.has(id)) return;
    ancestors.add(id);
    members.find(person => person.id === id)?.parentIds.forEach(collectAncestors);
  };
  [form.parent1, form.parent2].filter(Boolean).forEach(collectAncestors);
  options.forEach(person => {
    if ((person.spouseId && person.spouseId !== member?.id) || descendants.has(person.id) || ancestors.has(person.id) || person.parentIds.some(id => id === form.parent1 || id === form.parent2)) blockedSpouses.add(person.id);
  });

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    if (!form.displayName.trim()) { setError('Please enter the member’s full name.'); setTab('details'); return; }
    if (form.parent1 && form.parent1 === form.parent2) { setError('Choose two different parents.'); setTab('relationships'); return; }
    submitting.current = true;
    try {
      const details = { displayName: form.displayName.trim(), dateOfBirth: form.dateOfBirth || null, gender: form.gender, phone: form.phone.trim(), occupation: form.occupation.trim() };
      if (relationshipsChanged) {
        details.parentIds = [form.parent1, form.parent2].filter(Boolean);
        details.spouseId = form.spouseId || null;
      }
      let result;
      if (editing) result = await updateMember({ memberId: member.id, ...details }).unwrap();
      else result = await addMember({ ...details, ...(form.email.trim() ? { email: form.email.trim() } : {}), isHead: form.isHead }).unwrap();
      await dispatch(apiSlice.util.upsertQueryData('getFamily', undefined, result));
      toast.success(editing ? 'Member details and family tree updated' : 'Family member added');
      onClose();
    } catch (err) {
      const validation = err?.data?.errors?.[0]?.msg;
      setError(validation || (err?.status === 404 && String(err?.data?.message || '').includes('Not Found') ? 'The member-edit API is not available yet. Restart the Node backend, then try saving again.' : err?.data?.message) || 'Could not save this member. Please try again.');
    } finally { submitting.current = false; }
  }

  function personSelect(key, label) {
    return <label className="ft-field"><span>{label}</span><select value={form[key]} onChange={event => update(key, event.target.value)} className="theme-input"><option value="">Not selected</option>{options.map(person => {
      const blocked = key === 'spouseId' ? blockedSpouses.has(person.id) : descendants.has(person.id) || person.id === form.spouseId || person.id === form[key === 'parent1' ? 'parent2' : 'parent1'];
      return <option key={person.id} value={person.id} disabled={blocked}>{person.displayName}{blocked ? ' — unavailable' : ''}</option>;
    })}</select></label>;
  }

  const relationships = <div className="space-y-5">
    <div className="ft-form-note"><b>Connect this person to their family</b><p>Select <span translate="no">{form.displayName || 'this member'}</span>’s own parents and spouse. To link a child, edit the child and select this person as their parent.</p></div>
    {member?.needsRelationshipReview && <p className="ft-review-note">The old “{member.relationshipToHead || 'related to'}” label did not specify actual parents or spouse. Choose the correct people below, then save.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{personSelect('parent1', 'Parent 1')}{personSelect('parent2', 'Parent 2')}</div>
    {personSelect('spouseId', 'Spouse / partner')}
    <p className="text-xs leading-relaxed text-text-subtle">One or both parents may be left empty. A spouse connection appears on both people automatically. Only saved family members are listed; add missing people first.</p>
    {editing && !relationshipsChanged && <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={relationshipsChanged} onChange={event => setRelationshipsChanged(event.target.checked)} />I have reviewed these relationships. Save the selections above.</label>}
  </div>;

  return <FamilyDialog title={editing ? `Edit ${member.displayName}` : 'Add family member'} onClose={onClose} busy={busy}>
    <form onSubmit={submit}>
      <div className="ft-editor-tabs" role="tablist" aria-label="Member editor"><button type="button" role="tab" aria-selected={tab === 'details'} disabled={busy} onClick={() => setTab('details')}>Personal details</button><button type="button" role="tab" aria-selected={tab === 'relationships'} disabled={busy} onClick={() => setTab('relationships')}>Link family</button></div>
      <fieldset disabled={busy} className="ft-dialog-body">
        {tab === 'details' ? <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
          <label className="ft-field sm:col-span-2"><span>Full name *</span><input autoFocus required maxLength="120" className="theme-input" value={form.displayName} onChange={event => update('displayName', event.target.value)} /></label>
          <label className="ft-field"><span>Date of birth</span><input type="date" max={new Date().toISOString().slice(0, 10)} className="theme-input" value={form.dateOfBirth} onChange={event => update('dateOfBirth', event.target.value)} /></label>
          <label className="ft-field"><span>Gender</span><select className="theme-input" value={form.gender} onChange={event => update('gender', event.target.value)}><option value="">Not specified</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
          <label className="ft-field"><span>Phone</span><input type="tel" maxLength="30" className="theme-input" value={form.phone} onChange={event => update('phone', event.target.value)} /></label>
          <label className="ft-field"><span>Occupation</span><input maxLength="160" className="theme-input" value={form.occupation} onChange={event => update('occupation', event.target.value)} /></label>
          <label className="ft-field sm:col-span-2"><span>{editing ? 'Linked account email (read-only)' : 'Registered email (optional)'}</span><input type="email" dir="ltr" className="theme-input" readOnly={editing} value={editing ? member.userId?.email || '' : form.email} placeholder={editing ? 'No registered account linked' : 'Leave empty for a member without an account'} onChange={event => update('email', event.target.value)} /></label>
        </div>{!editing && <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={form.isHead} onChange={event => update('isHead', event.target.checked)} className="mt-1" /><span>Make this person the family head</span></label>}<Button variant="secondary" onClick={() => setTab('relationships')}>Next: Link parents & spouse →</Button></div> : relationships}
      </fieldset>
      <div className="ft-dialog-footer">{error && <p role="alert" className="mb-3 w-full text-sm text-danger">{error}</p>}<Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add member'}</Button></div>
    </form>
  </FamilyDialog>;
}
