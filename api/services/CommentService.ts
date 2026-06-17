import { db, generateId, now } from '../repositories/index.js';
import { AuthService } from './AuthService.js';
import type { Comment, CommentReply } from '../../shared/types.js';

export const CommentService = {
  list(diagramId: string, userId: string): Comment[] | undefined {
    const d = db.diagrams.findById(diagramId);
    if (!d || !AuthService.canView(userId, d.projectId)) return undefined;
    return db.comments.findMany(c => c.diagramId === diagramId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  create(diagramId: string, userId: string, data: { nodeId?: string; content: string }): Comment | null {
    const d = db.diagrams.findById(diagramId);
    if (!d || !AuthService.canView(userId, d.projectId)) return null;
    const comment: Comment = {
      id: generateId('c'),
      diagramId,
      nodeId: data.nodeId,
      authorId: userId,
      content: data.content,
      createdAt: now(),
      updatedAt: now(),
      resolved: false,
      replies: [],
    };
    return db.comments.create(comment);
  },

  addReply(diagramId: string, commentId: string, userId: string, content: string): CommentReply | null {
    const d = db.diagrams.findById(diagramId);
    if (!d || !AuthService.canView(userId, d.projectId)) return null;
    const c = db.comments.findById(commentId);
    if (!c || c.diagramId !== diagramId) return null;
    const reply: CommentReply = {
      id: generateId('cr'),
      authorId: userId,
      content,
      createdAt: now(),
      mentions: [],
    };
    c.replies.push(reply);
    db.comments.update(commentId, { replies: c.replies, updatedAt: now() });
    return reply;
  },

  update(diagramId: string, commentId: string, userId: string, changes: Partial<Comment>): Comment | null {
    const d = db.diagrams.findById(diagramId);
    if (!d || !AuthService.canEdit(userId, d.projectId)) return null;
    const c = db.comments.findById(commentId);
    if (!c || c.diagramId !== diagramId) return null;
    return db.comments.update(commentId, { ...changes, updatedAt: now() }) ?? null;
  },
};
