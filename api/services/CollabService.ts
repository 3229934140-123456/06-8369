import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';
import type { CollabMessage, OperationPayload, PresencePayload, User } from '../../shared/types.js';
import { DiagramService } from './DiagramService.js';
import { AuthService } from './AuthService.js';
import { db } from '../repositories/index.js';

// #region debug-point dp-logger
const DBG = {
  url: 'http://127.0.0.1:7777/event',
  sid: 'collab-sync-bugs',
  log: (point: string, event: string, data: any = {}) => {
    try {
      const body = JSON.stringify({ sessionId: DBG.sid, point, event, timestamp: Date.now(), data });
      const req = http.request(DBG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      });
      req.write(body);
      req.end();
    } catch (e) {}
  },
};
// #endregion

interface ClientState {
  ws: WebSocket;
  userId: string;
  diagramId: string;
  user?: User;
  lastMsgAt?: number;
}

const rooms: Map<string, Set<ClientState>> = new Map();

export const setupCollaborationServer = (server: HTTPServer) => {
  const wss = new WebSocketServer({ server, path: '/collab' });

  wss.on('connection', (ws: WebSocket) => {
    let state: ClientState | null = null;

    ws.on('message', (raw) => {
      try {
        const msg: CollabMessage = JSON.parse(raw.toString());
        if (!state) {
          const user = db.users.findById(msg.userId);
          if (!user) { ws.close(); return; }
          state = { ws, userId: msg.userId, diagramId: msg.diagramId, user };
          const room = rooms.get(msg.diagramId) ?? new Set();
          room.add(state);
          rooms.set(msg.diagramId, room);
          broadcast(msg.diagramId, {
            type: 'join', userId: msg.userId, diagramId: msg.diagramId,
            payload: { user, online: true } as PresencePayload,
            timestamp: Date.now(),
          }, state);
          sendRoomPresence(state);
          return;
        }

        state.diagramId = msg.diagramId;
        state.lastMsgAt = Date.now();
        switch (msg.type) {
          case 'cursor': {
            const augmentedPayload = { ...(msg.payload as object), user: state!.user };
            const broadcastMsg: CollabMessage = {
              ...msg,
              payload: augmentedPayload as any,
            };
            // #region debug-point dp-04
            DBG.log('dp-04', 'broadcast:cursor', {
              fromUserId: msg.userId,
              diagramId: msg.diagramId,
              hasUserInPayload: !!(broadcastMsg.payload as any).user,
              userName: (broadcastMsg.payload as any).user?.name,
              cursorX: (msg.payload as any).x,
              cursorY: (msg.payload as any).y,
            });
            // #endregion
            broadcast(msg.diagramId, broadcastMsg, state);
            break;
          }
          case 'op': {
            const payload = msg.payload as OperationPayload;
            const u = AuthService.getUserById(msg.userId);
            // #region debug-point dp-04
            DBG.log('dp-04', 'broadcast:op', {
              fromUserId: msg.userId,
              diagramId: msg.diagramId,
              opTypes: payload.operations.map((o: any) => o.type),
              hasNodeUpdate: payload.operations.some((o: any) => o.type === 'node:update'),
            });
            // #endregion
            if (u) DiagramService.applyOperations(msg.diagramId, msg.userId, payload.operations);
            broadcast(msg.diagramId, msg, state);
            break;
          }
          case 'presence': {
            broadcast(msg.diagramId, msg, state);
            break;
          }
        }
      } catch (e) {
        console.error('Collab msg error:', e);
      }
    });

    ws.on('close', () => {
      if (!state) return;
      const room = rooms.get(state.diagramId);
      if (room) {
        room.delete(state);
        if (room.size === 0) rooms.delete(state.diagramId);
        else {
          broadcast(state.diagramId, {
            type: 'leave', userId: state.userId, diagramId: state.diagramId,
            payload: { user: state.user!, online: false } as PresencePayload,
            timestamp: Date.now(),
          });
          broadcastRoomPresence(state.diagramId);
        }
      }
    });
  });

  const clientTimer = setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, diagramId) => {
      room.forEach(c => {
        if (c.lastMsgAt && now - c.lastMsgAt > 90_000) {
          try { c.ws.close(); } catch {}
          room.delete(c);
        }
      });
      if (room.size === 0) rooms.delete(diagramId);
      else broadcastRoomPresence(diagramId);
    });
  }, 30_000);
  wss.on('close', () => clearInterval(clientTimer));

  const broadcast = (diagramId: string, msg: CollabMessage, exclude?: ClientState | null) => {
    const room = rooms.get(diagramId);
    if (!room) return;
    const data = JSON.stringify(msg);
    room.forEach(c => {
      if (c !== exclude && c.ws.readyState === WebSocket.OPEN) c.ws.send(data);
    });
  };

  const broadcastRoomPresence = (diagramId: string) => {
    const room = rooms.get(diagramId);
    if (!room) return;
    const users: { user: User; online: boolean }[] = [];
    room.forEach(c => { if (c.user) users.push({ user: c.user, online: true }); });
    room.forEach(c => {
      if (c.ws.readyState !== WebSocket.OPEN) return;
      const payload: PresencePayload = { users, self: c.user! };
      c.ws.send(JSON.stringify({
        type: 'presence', userId: c.userId, diagramId, payload, timestamp: Date.now(),
      } as CollabMessage));
    });
  };

  const sendRoomPresence = (client: ClientState) => {
    const room = rooms.get(client.diagramId);
    if (!room) return;
    const users: { user: User; online: boolean }[] = [];
    room.forEach(c => { if (c.user) users.push({ user: c.user, online: true }); });
    const payload: PresencePayload = { users, self: client.user! };
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'presence', userId: client.userId, diagramId: client.diagramId,
        payload, timestamp: Date.now(),
      } as CollabMessage));
    }
    broadcastRoomPresence(client.diagramId);
  };

  console.log('[Collab] WebSocket server mounted at /collab');
  return wss;
};
