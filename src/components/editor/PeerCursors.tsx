import React from 'react';
import { useDiagramStore } from '../../store/useDiagramStore.js';
import type { Viewport, CursorPayload } from '@shared/types.js';
import { viewportToScreen } from '../../lib/geometry.js';

// #region debug-point dp-logger
const DBG_ENABLED = (typeof window !== 'undefined') && window.localStorage.getItem('DEBUG_COLLAB') === '1';
const DBG = DBG_ENABLED ? {
  url: 'http://127.0.0.1:7777/event',
  sid: 'collab-sync-bugs',
  log: (point: string, event: string, data: any = {}) => {
    try {
      fetch(DBG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: DBG.sid, point, event, timestamp: Date.now(), data }),
      }).catch(() => {});
    } catch (e) {}
  },
} : { log: () => {} };
// #endregion

interface Props {
  viewport: Viewport;
}

export const PeerCursors: React.FC<Props> = ({ viewport }) => {
  const peers = useDiagramStore(s => s.peers);

  // #region debug-point dp-07
  const peerList = Array.from(peers.values());
  if (peerList.length > 0) {
    DBG.log('dp-07', 'render-cursors', {
      count: peerList.length,
      peers: peerList.map(p => ({
        userId: p.user.id, name: p.user.name, color: p.user.color,
        hasCursor: !!p.cursor, x: p.cursor?.x, y: p.cursor?.y,
      })),
    });
  }
  // #endregion

  return (
    <>
      {Array.from(peers.values()).map(({ user, cursor }) => {
        if (!cursor) return null;
        const p = viewportToScreen(viewport, cursor.x, cursor.y);
        return (
          <div
            key={user.id}
            className="collab-cursor"
            style={{
              transform: `translate(${p.x}px, ${p.y}px)`,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 2 L3 18 L7.5 13.5 L11 20 L13.5 18.5 L10 12.5 L17 12 Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="collab-cursor-label"
              style={{ backgroundColor: user.color, boxShadow: `0 2px 8px ${user.color}55` }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </>
  );
};
