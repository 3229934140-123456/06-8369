import { db } from '../repositories/index.js';
import type { User, MemberRole } from '../../shared/types.js';

const DEMO_TOKEN = 'demo-token-flowsync';

export const AuthService = {
  login(email: string, _password: string): { user: User; token: string } | null {
    const user = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const all = db.users.findAll();
      if (all.length > 0) return { user: all[0], token: DEMO_TOKEN };
      return null;
    }
    return { user, token: DEMO_TOKEN };
  },

  authenticate(token: string | undefined): User | null {
    if (!token) return null;
    if (token.startsWith('Bearer ')) token = token.slice(7);
    if (token !== DEMO_TOKEN) return null;
    const all = db.users.findAll();
    return all[0] || null;
  },

  getUserById(id: string): User | undefined {
    return db.users.findById(id);
  },

  listAllUsers(): User[] {
    return db.users.findAll();
  },

  checkProjectPermission(userId: string, projectId: string): MemberRole | null {
    const project = db.projects.findById(projectId);
    if (!project) return null;
    if (project.ownerId === userId) return 'admin';
    const membership = project.members.find(m => m.userId === userId);
    return membership?.role ?? null;
  },

  canEdit(userId: string, projectId: string): boolean {
    const role = this.checkProjectPermission(userId, projectId);
    return role === 'admin' || role === 'editor';
  },

  canView(userId: string, projectId: string): boolean {
    return this.checkProjectPermission(userId, projectId) !== null;
  },
};
