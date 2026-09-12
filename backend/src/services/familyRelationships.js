const id = value => String(value?._id || value);
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };

function needsRelationshipReview(member) {
  return !member.relationshipsReviewed && Boolean(member.parentMemberId ||
    (member.relationshipToHead && !['self', 'member'].includes(member.relationshipToHead)));
}

function validateConnections(members, connections) {
  const memberIds = new Set(members.map(member => id(member._id)));
  const parents = new Map([...memberIds].map(memberId => [memberId, []]));
  const spouses = new Map();
  const seen = new Set();
  for (const edge of connections) {
    const from = id(edge.fromMemberId), to = id(edge.toMemberId);
    if (!memberIds.has(from) || !memberIds.has(to)) fail('Select members from your own family');
    if (from === to) fail('A member cannot be their own parent or spouse');
    if (!['parent', 'spouse'].includes(edge.kind)) fail('Invalid relationship type');
    const pair = edge.kind === 'spouse' ? [from, to].sort().join(':') : `${from}:${to}`;
    const key = `${edge.kind}:${pair}`;
    if (seen.has(key)) fail('This relationship already exists');
    seen.add(key);
    if (edge.kind === 'parent') {
      parents.get(to).push(from);
      if (parents.get(to).length > 2) fail('A member can have at most two parents');
    } else {
      if (spouses.has(from) || spouses.has(to)) fail('A member can have only one spouse. Remove the existing spouse connection first.');
      spouses.set(from, to);
      spouses.set(to, from);
    }
  }
  for (const [memberId, spouseId] of spouses) {
    if (parents.get(memberId).some(parent => parents.get(spouseId).includes(parent))) {
      fail('Members with a shared parent cannot be connected as spouses');
    }
  }

  // Treat a couple as one generation block. This rejects ancestry cycles and
  // spouse links that would make a person their partner's ancestor/descendant.
  const groupOf = memberId => spouses.has(memberId) ? [memberId, spouses.get(memberId)].sort()[0] : memberId;
  const graph = new Map([...memberIds].map(memberId => [groupOf(memberId), new Set()]));
  for (const edge of connections.filter(edge => edge.kind === 'parent')) {
    const from = groupOf(id(edge.fromMemberId)), to = groupOf(id(edge.toMemberId));
    if (from === to) fail('A parent or ancestor cannot also be a spouse');
    graph.get(from).add(to);
  }
  const visiting = new Set(), visited = new Set();
  function visit(node) {
    if (visiting.has(node)) fail('These connections create an ancestry cycle or incompatible generations');
    if (visited.has(node)) return;
    visiting.add(node);
    graph.get(node).forEach(visit);
    visiting.delete(node);
    visited.add(node);
  }
  graph.forEach((_, node) => visit(node));
}

function replaceMemberConnections(family, memberId, body) {
  const target = id(memberId);
  const changesParents = Object.hasOwn(body, 'parentIds');
  const changesSpouse = Object.hasOwn(body, 'spouseId');
  const connections = (family.connections || []).filter(edge => {
    if (changesParents && edge.kind === 'parent' && id(edge.toMemberId) === target) return false;
    if (changesSpouse && edge.kind === 'spouse' && [id(edge.fromMemberId), id(edge.toMemberId)].includes(target)) return false;
    return true;
  }).map(edge => ({ kind: edge.kind, fromMemberId: edge.fromMemberId, toMemberId: edge.toMemberId }));
  if (changesParents) {
    for (const parent of body.parentIds) connections.push({ kind: 'parent', fromMemberId: parent, toMemberId: memberId });
  }
  if (changesSpouse && body.spouseId) connections.push({ kind: 'spouse', fromMemberId: memberId, toMemberId: body.spouseId });
  validateConnections(family.members, connections);
  family.connections = connections;
}

function serializeFamily(family) {
  const plain = family.toObject();
  const connections = plain.connections || [];
  const reviewMembers = plain.members.filter(needsRelationshipReview);
  const nodes = plain.members.map(member => ({
    ...member,
    id: id(member._id),
    parentIds: connections.filter(edge => edge.kind === 'parent' && id(edge.toMemberId) === id(member._id)).map(edge => id(edge.fromMemberId)),
    spouseId: (() => {
      const edge = connections.find(edge => edge.kind === 'spouse' && [id(edge.fromMemberId), id(edge.toMemberId)].includes(id(member._id)));
      return edge ? id(edge.fromMemberId) === id(member._id) ? id(edge.toMemberId) : id(edge.fromMemberId) : null;
    })(),
    needsRelationshipReview: needsRelationshipReview(member),
  }));

  // Keep the old root/orphans response available, while the new UI renders
  // explicit nodes/connections and all roots independently of the family head.
  const byId = new Map(nodes.map(member => [member.id, member]));
  const visited = new Set();
  function branch(memberId) {
    if (!byId.has(memberId) || visited.has(memberId)) return null;
    visited.add(memberId);
    const node = byId.get(memberId);
    return { ...node, children: nodes.filter(child => child.parentIds[0] === memberId).map(child => branch(child.id)).filter(Boolean) };
  }
  const head = nodes.find(member => id(member._id) === id(plain.headMemberId)) || nodes.find(member => member.isHead);
  const root = head ? branch(head.id) : null;
  const orphans = [];
  for (const node of nodes) if (!visited.has(node.id)) { const tree = branch(node.id); if (tree) orphans.push(tree); }
  return {
    family: { ...plain, members: nodes, connections },
    tree: { root, orphans, nodes, connections, roots: nodes.filter(node => !node.parentIds.length).map(node => node.id) },
    relationshipReview: reviewMembers.map(member => ({ memberId: id(member._id), relatedMemberId: member.parentMemberId ? id(member.parentMemberId) : null, legacyRelation: member.relationshipToHead })),
  };
}

module.exports = { validateConnections, replaceMemberConnections, serializeFamily };
