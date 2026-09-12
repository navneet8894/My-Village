export const memberId = member => String(member?._id || member?.id || member);
export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 184;
const PARTNER_GAP = 36;
const BLOCK_GAP = 56;
const ROW_GAP = 112;

export function familyMembers(family) {
  const edges = family?.connections || [];
  return (family?.members || []).map(member => {
    const id = memberId(member);
    const spouse = edges.find(edge => edge.kind === 'spouse' && [String(edge.fromMemberId), String(edge.toMemberId)].includes(id));
    return {
      ...member, id,
      parentIds: member.parentIds || edges.filter(edge => edge.kind === 'parent' && String(edge.toMemberId) === id).map(edge => String(edge.fromMemberId)),
      spouseId: member.spouseId || (spouse ? String(spouse.fromMemberId) === id ? String(spouse.toMemberId) : String(spouse.fromMemberId) : ''),
      needsRelationshipReview: member.needsRelationshipReview ?? (!member.relationshipsReviewed && Boolean(member.parentMemberId || (member.relationshipToHead && !['self', 'member'].includes(member.relationshipToHead)))),
    };
  });
}

export function relationToHead(member, head, members) {
  if (!head) return 'Family member';
  const label = (male, female, neutral) => member.gender === 'male' ? male : member.gender === 'female' ? female : neutral;
  if (member.id === head.id) return 'Family head';
  if (member.spouseId === head.id) return label('Husband', 'Wife', 'Spouse');
  if (head.parentIds.includes(member.id)) return label('Father', 'Mother', 'Parent');
  if (member.parentIds.includes(head.id)) return label('Son', 'Daughter', 'Child');
  if (member.parentIds.some(id => head.parentIds.includes(id))) return label('Brother', 'Sister', 'Sibling');
  const byId = new Map(members.map(person => [person.id, person]));
  if (head.parentIds.some(id => byId.get(id)?.parentIds.includes(member.id))) return label('Grandfather', 'Grandmother', 'Grandparent');
  if (member.parentIds.some(id => byId.get(id)?.parentIds.includes(head.id))) return label('Grandson', 'Granddaughter', 'Grandchild');
  return member.needsRelationshipReview ? 'Relationship needs review' : 'Family member';
}

export function connectedFamily(members, headId) {
  const graph = new Map(members.map(member => [member.id, new Set()]));
  members.forEach(member => {
    [...member.parentIds, member.spouseId].filter(Boolean).forEach(other => {
      if (graph.has(other)) { graph.get(member.id).add(other); graph.get(other).add(member.id); }
    });
  });
  const visited = new Set();
  const queue = graph.has(headId) ? [headId] : [];
  while (queue.length) {
    const id = queue.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    graph.get(id).forEach(other => queue.push(other));
  }
  return visited;
}

export function descendantsOf(members, rootId) {
  const found = new Set();
  const queue = [rootId];
  while (queue.length) {
    const id = queue.pop();
    members.filter(member => member.parentIds.includes(id)).forEach(member => {
      if (!found.has(member.id) && member.id !== rootId) { found.add(member.id); queue.push(member.id); }
    });
  }
  return found;
}

// Spouses share a block. Longest parent path determines each generation.
// Every member is positioned once, including separate branches and single parents.
export function layoutFamily(members) {
  const byId = new Map(members.map(member => [member.id, member]));
  const groups = [], groupOf = new Map();
  for (const member of members) {
    if (groupOf.has(member.id)) continue;
    const people = [member];
    if (byId.has(member.spouseId) && !groupOf.has(member.spouseId)) people.push(byId.get(member.spouseId));
    const group = { id: member.id, people, parents: new Set(), children: new Set(), depth: 0, order: groups.length };
    groups.push(group);
    people.forEach(person => groupOf.set(person.id, group));
  }
  members.forEach(member => member.parentIds.forEach(parentId => {
    const from = groupOf.get(parentId), to = groupOf.get(member.id);
    if (from && to && from !== to) { from.children.add(to); to.parents.add(from); }
  }));
  const indegree = new Map(groups.map(group => [group.id, group.parents.size]));
  const queue = groups.filter(group => !group.parents.size);
  let processed = 0;
  while (queue.length) {
    const group = queue.shift(); processed += 1;
    group.children.forEach(child => {
      child.depth = Math.max(child.depth, group.depth + 1);
      indegree.set(child.id, indegree.get(child.id) - 1);
      if (!indegree.get(child.id)) queue.push(child);
    });
  }
  // A malformed historic graph must remain visible rather than recurse forever.
  if (processed !== groups.length) groups.forEach(group => { group.depth = 0; });
  const rows = [];
  groups.forEach(group => { (rows[group.depth] ||= []).push(group); });
  const groupWidth = group => group.people.length * CARD_WIDTH + (group.people.length - 1) * PARTNER_GAP;
  const rowWidth = row => row.reduce((total, group) => total + groupWidth(group), 0) + Math.max(0, row.length - 1) * BLOCK_GAP;
  const width = Math.max(560, ...rows.map(row => rowWidth(row) + 96));
  const positions = new Map();
  rows.forEach((row, depth) => {
    const parentCenter = group => {
      const parents = [...group.parents];
      return parents.length ? parents.reduce((sum, parent) => sum + (parent.center ?? width / 2), 0) / parents.length : width / 2;
    };
    row.sort((a, b) => parentCenter(a) - parentCenter(b) || a.order - b.order);
    let x = (width - rowWidth(row)) / 2;
    row.forEach(group => {
      group.center = x + groupWidth(group) / 2;
      group.people.forEach((person, index) => positions.set(person.id, { x: x + index * (CARD_WIDTH + PARTNER_GAP), y: 64 + depth * (CARD_HEIGHT + ROW_GAP) }));
      x += groupWidth(group) + BLOCK_GAP;
    });
  });
  return { positions, groups, width, height: Math.max(350, rows.length * (CARD_HEIGHT + ROW_GAP) + 8), generations: rows.length, malformed: processed !== groups.length };
}
