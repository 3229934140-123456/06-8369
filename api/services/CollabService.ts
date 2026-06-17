import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { CollabMessage, CursorPayload, OperationPayload, PresencePayload, User } from '../../shared/types.js';
import { DiagramService } from './DiagramService.js';
import { AuthService } from './AuthService.js';
import { db } from '../repositories/index.js';

interface ClientState {
  ws: WebSocket;
  userId: string;
  diagramId: string;
  user?: User;
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
        switch (msg.type) {
          case 'cursor': {
            broadcast(msg.diagramId, msg, state);
            break;
          }
          case 'op': {
            const payload = msg.payload as OperationPayload;
            const u = AuthService.getUserById(msg.userId);
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
        else broadcast(state.diagramId, {
          type: 'leave', userId: state.userId, diagramId: state.diagramId,
          payload: { user: state.user!, online: false } as PresencePayload,
          timestamp: Date.now(),
        });
      }
    });
  });

  const broadcast = (diagramId: string, msg: CollabMessage, exclude?: ClientState | null) => {
    const room = rooms.get(diagramId);
    if (!room) return;
    const data = JSON.stringify(msg);
    room.forEach(c => {
      if (c !== exclude && c.ws.readyState === WebSocket.OPEN) c.ws.send(data);
    });
  };

  const sendRoomPresence = (client: ClientState) => {
    const room = rooms.get(client.diagramId);
    if (!room) return;
    const users: { user: User; online: boolean }[] = [];
    room.forEach(c => { if (c.user) users.push({ user: c.user, online: true }); });
    const payload: CollabMessage = {
      type: 'presence', userId: client.userId, diagramId: client.diagramId,
      payload: { users } as any, timestamp: Date.now(),
    };
    if (client.ws.readyState === WebSocket.OPEN) client.ws.send(JSON.stringify(payload));
  };

  console.log('[Collab] WebSocket server mounted at /collab');
  return wss;
};
