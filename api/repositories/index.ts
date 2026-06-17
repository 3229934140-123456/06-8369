import { MemoryRepository } from './MemoryRepository.js';
import { USERS, PROJECTS, DIAGRAMS, VERSIONS, COMMENTS, TEMPLATES, now } from '../../shared/seed-data.js';
import type { User, Project, Diagram, DiagramVersion, Comment, DiagramTemplate } from '../../shared/types.js';

export const db = {
  users: new MemoryRepository<User>([...USERS]),
  projects: new MemoryRepository<Project>([...PROJECTS]),
  diagrams: new MemoryRepository<Diagram>([...DIAGRAMS]),
  versions: new MemoryRepository<DiagramVersion>([...VERSIONS]),
  comments: new MemoryRepository<Comment>([...COMMENTS]),
  templates: new MemoryRepository<DiagramTemplate>([...TEMPLATES]),
};

export const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export { now };
