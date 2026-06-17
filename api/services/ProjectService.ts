import { db, generateId, now } from '../repositories/index.js';
import { AuthService } from './AuthService.js';
import type { Project, ProjectMember, MemberRole, User } from '../../shared/types.js';

export const ProjectService = {
  listByUser(userId: string): Project[] {
    return db.projects.findMany(p =>
      p.ownerId === userId || p.members.some(m => m.userId === userId)
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getById(id: string, userId: string): Project | undefined {
    const p = db.projects.findById(id);
    if (!p) return undefined;
    if (!AuthService.canView(userId, id)) return undefined;
    return p;
  },

  create(userId: string, data: { name: string; description: string }): Project {
    const project: Project = {
      id: generateId('p'),
      name: data.name,
      description: data.description,
      createdAt: now(),
      updatedAt: now(),
      ownerId: userId,
      members: [{ userId, role: 'admin' as MemberRole, joinedAt: now() }],
    };
    return db.projects.create(project);
  },

  update(id: string, userId: string, changes: Partial<Project>): Project | undefined {
    if (!AuthService.canEdit(userId, id)) return undefined;
    return db.projects.update(id, { ...changes, updatedAt: now() });
  },

  delete(id: string, userId: string): boolean {
    const p = db.projects.findById(id);
    if (!p || p.ownerId !== userId) return false;
    db.diagrams.findMany(d => d.projectId === id).forEach(d => {
      db.versions.findMany(v => v.diagramId === d.id).forEach(v => db.versions.delete(v.id));
      db.comments.findMany(c => c.diagramId === d.id).forEach(c => db.comments.delete(c.id));
      db.diagrams.delete(d.id);
    });
    return db.projects.delete(id);
  },

  listMembers(projectId: string, userId: string): (User & { role: MemberRole })[] | undefined {
    if (!AuthService.canView(userId, projectId)) return undefined;
    const p = db.projects.findById(projectId);
    if (!p) return undefined;
    return p.members.map(m => {
      const user = db.users.findById(m.userId);
      return { ...(user as User), role: m.role };
    });
  },

  addMember(projectId: string, userId: string, targetEmail: string, role: MemberRole): ProjectMember | null {
    if (!AuthService.canEdit(userId, projectId)) return null;
    const p = db.projects.findById(projectId);
    if (!p) return null;
    const target = db.users.findOne(u => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (!target) return null;
    if (p.members.some(m => m.userId === target.id)) return null;
    const member: ProjectMember = { userId: target.id, role, joinedAt: now() };
    p.members.push(member);
    db.projects.update(projectId, { members: p.members, updatedAt: now() });
    return member;
  },

  updateMemberRole(projectId: string, userId: string, targetUserId: string, role: MemberRole): ProjectMember | null {
    if (!AuthService.canEdit(userId, projectId)) return null;
    const p = db.projects.findById(projectId);
    if (!p) return null;
    if (p.ownerId === targetUserId) return null;
    const idx = p.members.findIndex(m => m.userId === targetUserId);
    if (idx < 0) return null;
    p.members[idx].role = role;
    db.projects.update(projectId, { members: p.members, updatedAt: now() });
    return p.members[idx];
  },

  removeMember(projectId: string, userId: string, targetUserId: string): boolean {
    if (!AuthService.canEdit(userId, projectId)) return false;
    const p = db.projects.findById(projectId);
    if (!p) return false;
    if (p.ownerId === targetUserId) return false;
    p.members = p.members.filter(m => m.userId !== targetUserId);
    db.projects.update(projectId, { members: p.members, updatedAt: now() });
    return true;
  },
};
