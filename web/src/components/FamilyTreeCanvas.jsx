import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../shared/ui';
import { CARD_HEIGHT, CARD_WIDTH, layoutFamily, relationToHead } from '../utils/familyTree';

export function MemberAvatar({ member }) {
  const avatar = member.userId?.avatar;
  const initials = member.displayName?.trim().split(/\s+/).map(word => word[0]).slice(0, 2).join('').toUpperCase() || '?';
  return <span className="ft-avatar" translate="no">{avatar ? <img src={avatar} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /> : null}<span>{initials}</span></span>;
}

export function FamilyPersonCard({ member, members, head, onDetails, onEdit, onLink }) {
  return <article className={`ft-person ${member.isHead ? 'ft-person-head' : ''}`}>
    <div className="flex items-start justify-between gap-2"><MemberAvatar member={member} />{member.isHead ? <span className="ft-head-badge">Family head</span> : <span className="ft-person-dot" aria-hidden="true" />}</div>
    <button className="ft-person-name" onClick={() => onDetails(member)} title={member.displayName}><span translate="no">{member.displayName}</span></button>
    <p className="ft-person-relation">{relationToHead(member, head, members)}</p>
    <div className="ft-person-actions"><button onClick={() => onEdit(member)}>Edit details</button><button onClick={() => onLink(member)}>Link family <span aria-hidden="true">↗</span></button></div>
  </article>;
}

export default function FamilyTreeCanvas({ members, head, onDetails, onEdit, onLink }) {
  const layout = useMemo(() => layoutFamily(members), [members]);
  const [zoom, setZoom] = useState(1);
  const viewport = useRef(null);
  const positions = layout.positions;
  useEffect(() => {
    if (viewport.current) viewport.current.scrollLeft = Math.max(0, (layout.width - viewport.current.clientWidth) / 2);
  }, [layout.width]);
  function reset() {
    setZoom(1);
    requestAnimationFrame(() => {
      viewport.current?.scrollTo({ left: Math.max(0, (layout.width - viewport.current.clientWidth) / 2), top: 0, behavior: 'smooth' });
    });
  }
  function fit() { setZoom(Math.max(0.25, Math.min(1, (viewport.current.clientWidth - 20) / layout.width))); viewport.current.scrollTo(0, 0); }
  return <section className="ft-canvas-panel">
    <div className="ft-canvas-toolbar"><div><h2 className="font-bold">Your family, connected</h2><p className="mt-1 text-xs text-text-subtle">Parents above · Partners together · Children below</p></div><div className="flex flex-wrap items-center gap-1"><Button variant="ghost" disabled={zoom <= 0.25} aria-label="Zoom out" onClick={() => setZoom(value => Math.max(0.25, +(value - 0.1).toFixed(2)))}>−</Button><span className="w-12 text-center text-xs tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span><Button variant="ghost" disabled={zoom >= 1.5} aria-label="Zoom in" onClick={() => setZoom(value => Math.min(1.5, +(value + 0.1).toFixed(2)))}>+</Button><Button variant="secondary" onClick={fit}>Fit</Button><Button variant="ghost" onClick={reset}>Reset</Button></div></div>
    {layout.malformed && <p role="alert" className="p-4 text-warning-text">Some saved connections need review. Use Link family to correct them.</p>}
    <div className="ft-viewport" ref={viewport} tabIndex="0" aria-label="Family tree. Scroll to explore, or use the zoom controls.">
      <div style={{ width: layout.width * zoom, height: layout.height * zoom, position: 'relative' }}>
        <div className="ft-stage" style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})` }}>
          <svg className="ft-connectors" width={layout.width} height={layout.height} aria-hidden="true">
            {layout.groups.filter(group => group.people.length === 2).map(group => {
              const first = positions.get(group.people[0].id), second = positions.get(group.people[1].id);
              const y = first.y + CARD_HEIGHT / 2;
              return <g key={`spouse-${group.id}`}><path className="ft-spouse-line" d={`M ${first.x + CARD_WIDTH} ${y} H ${second.x}`} /><circle className="ft-spouse-point" cx={(first.x + CARD_WIDTH + second.x) / 2} cy={y} r="5" /></g>;
            })}
            {members.flatMap(member => member.parentIds.map(parentId => {
              const from = positions.get(parentId), to = positions.get(member.id);
              if (!from || !to || to.y <= from.y) return null;
              const x1 = from.x + CARD_WIDTH / 2, y1 = from.y + CARD_HEIGHT;
              const x2 = to.x + CARD_WIDTH / 2, y2 = to.y;
              const mid = y2 - 44;
              const path = x1 === x2 ? `M ${x1} ${y1} V ${y2}` : `M ${x1} ${y1} V ${mid - 8} Q ${x1} ${mid} ${x1 + (x2 > x1 ? 8 : -8)} ${mid} H ${x2} V ${y2}`;
              return <g key={`${parentId}-${member.id}`}><path className="ft-parent-line" d={path} /><circle className="ft-parent-point" cx={x2} cy={y2} r="4" /></g>;
            }))}
          </svg>
          {Array.from({ length: layout.generations }, (_, depth) => <p key={depth} className="ft-generation" style={{ top: 30 + depth * (CARD_HEIGHT + 112) }}>Generation {depth + 1}</p>)}
          {members.map(member => { const position = positions.get(member.id); return <div key={member.id} className="ft-node" style={{ left: position.x, top: position.y, width: CARD_WIDTH, height: CARD_HEIGHT }}><FamilyPersonCard {...{ member, members, head, onDetails, onEdit, onLink }} /></div>; })}
        </div>
      </div>
    </div>
    <div className="ft-canvas-footer"><span><i className="ft-legend-parent" /> Parent / child</span><span><i className="ft-legend-spouse" /> Spouse</span><span className="ms-auto">Scroll to explore your family</span></div>
  </section>;
}
