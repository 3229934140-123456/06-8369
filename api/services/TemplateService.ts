import { db } from '../repositories/index.js';
import { AuthService } from './AuthService.js';
import type { DiagramTemplate, DiagramType } from '../../shared/types.js';

export const TemplateService = {
  list(type?: DiagramType, category?: string): DiagramTemplate[] {
    let result = db.templates.findAll();
    if (type) result = result.filter(t => t.type === type);
    if (category) result = result.filter(t => t.category === category);
    return result;
  },

  getById(id: string): DiagramTemplate | undefined {
    return db.templates.findById(id);
  },

  getEmbedInfo(_userId: string, diagramId: string) {
    const d = db.diagrams.findById(diagramId);
    if (!d) return null;
    return {
      diagramId,
      diagramName: d.name,
      embedCode: `<iframe src="${process.env.ORIGIN || 'http://localhost:5173'}/embed/${d.id}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`,
      sync: true,
      updatedAt: d.updatedAt,
    };
  },

  stats(userId: string) {
    const projects = AuthService.checkProjectPermission ? db.projects.findMany(p => p.ownerId === userId || p.members.some(m => m.userId === userId)).length : 0;
    const diagrams = projects ? db.diagrams.findMany(d => {
      return true;
    }).length : 0;
    return {
      projects,
      diagrams,
      collaborators: db.users.count(),
      versions: db.versions.count(),
    };
  },
};
