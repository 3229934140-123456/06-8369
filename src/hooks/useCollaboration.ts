import { useEffect, useRef, useCallback } from 'react';
import { useDiagramStore } from '../store/useDiagramStore.js';
import { useUserStore } from '../store/useUserStore.js';
import type { CollabMessage, Operation, CursorPayload, PresencePayload, User } from '@shared/types.js';

const WS_URL = (() => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/collab`;
})();

export const useCollaboration = (diagramId: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const joinedRef = useRef(false);
  const user = useUserStore(s => s.user);
  const applyOps = useDiagramStore(s => s.applyOps);
  const setPeer = useDiagramStore(s => s.setPeer);
  const removePeer = useDiagramStore(s => s.removePeer);

  const connect = useCallback(() => {
    if (!diagramId || !user) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      joinedRef.current = false;
      sendJoin();
    };

    ws.onmessage = (ev) => {
      try {
        const msg: CollabMessage = JSON.parse(ev.data);
        if (msg.userId === user.id) return;
        handleMessage(msg);
      } catch (e) { console.error('WS message error', e); }
    };

    ws.onclose = () => {
      joinedRef.current = false;
      reconnectRef.current = window.setTimeout(connect, 3000);
    };
  }, [diagramId, user?.id]);

  const sendJoin = () => {
    if (!user || !diagramId) return;
    const msg: CollabMessage = {
      type: 'join', userId: user.id, diagramId,
      payload: { user, online: true } as PresencePayload,
      timestamp: Date.now(),
    };
    rawSend(msg);
    joinedRef.current = true;
  };

  const rawSend = (msg: CollabMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const sendCursor = useCallback((cursor: CursorPayload) => {
    if (!user || !diagramId || !joinedRef.current) return;
    rawSend({
      type: 'cursor', userId: user.id, diagramId,
      payload: cursor,
      timestamp: Date.now(),
    });
  }, [user?.id, diagramId]);

  const sendOps = useCallback((operations: Operation[]) => {
    if (!user || !diagramId || !joinedRef.current) return;
    rawSend({
      type: 'op', userId: user.id, diagramId,
      payload: { opId: crypto.randomUUID(), operations },
      timestamp: Date.now(),
    });
  }, [user?.id, diagramId]);

  const handleMessage = (msg: CollabMessage) => {
    switch (msg.type) {
      case 'cursor': {
        const p = msg.payload as CursorPayload & { user?: User };
        const userInPayload = (msg.payload as any).user;
        setPeer({
          user: userInPayload ?? {
            id: msg.userId, name: '协作者', email: '', avatar: 'C', color: '#3B82F6',
          },
          cursor: msg.payload as CursorPayload,
          lastSeen: msg.timestamp,
        });
        break;
      }
      case 'op': {
        const p = msg.payload as any;
        applyOps(p.operations ?? [], true);
        break;
      }
      case 'join': {
        const payload = msg.payload as PresencePayload & { users?: { user: User; online: boolean }[] };
        if (payload.users) {
          payload.users.forEach(({ user: u }) => {
            if (u.id !== user?.id) setPeer({ user: u, lastSeen: Date.now() });
          });
        } else if (payload.user) {
          setPeer({ user: payload.user, lastSeen: Date.now() });
        }
        break;
      }
      case 'leave': {
        const payload = msg.payload as PresencePayload;
        if (payload.user) removePeer(payload.user.id);
        break;
      }
      case 'presence': {
        const payload = msg.payload as PresencePayload & { users?: { user: User; online: boolean }[] };
        if (payload.users) {
          payload.users.forEach(({ user: u }) => {
            if (u.id !== user?.id) setPeer({ user: u, lastSeen: Date.now() });
          });
        } else if (payload.user) {
          setPeer({ user: payload.user, lastSeen: Date.now() });
        }
        break;
      }
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      joinedRef.current = false;
    };
  }, [connect]);

  useEffect(() => {
    const origApply = useDiagramStore.getState().applyOps;
    useDiagramStore.setState({
      applyOps: (ops, remote) => {
        origApply(ops, remote);
        if (!remote && ops.some(o => o.type !== 'viewport:update')) {
          sendOps(ops);
        }
      },
    } as any);
    return () => {
      useDiagramStore.setState({ applyOps: origApply } as any);
    };
  }, [sendOps]);

  return { sendCursor, connected: wsRef.current?.readyState === WebSocket.OPEN };
};
