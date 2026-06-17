import React from 'react';
import { useDiagramStore } from '../../store/useDiagramStore.js';
import type { Viewport, CursorPayload } from '@shared/types.js';
import { viewportToScreen } from '../../lib/geometry.js';

interface Props {
  viewport: Viewport;
}

export const PeerCursors: React.FC<Props> = ({ viewport }) => {
  const peers = useDiagramStore(s => s.peers);

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
