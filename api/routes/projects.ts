import { Router } from 'express';
import { AuthService } from '../services/AuthService.js';
import { ProjectService } from '../services/ProjectService.js';
import { DiagramService } from '../services/DiagramService.js';
import type { Request, Response } from 'express';

export const projectRouter = Router();

const json = (res: Response, code: number, body: any) => {
  res.status(code).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const authMiddleware = (req: Request, res: Response) => {
  const u = AuthService.authenticate(req.headers.authorization);
  if (!u) { json(res, 401, { error: '未登录' }); return null; }
  return u;
};

projectRouter.get('/', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  json(res, 200, ProjectService.listByUser(u.id));
});

projectRouter.get('/:id', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const p = ProjectService.getById(req.params.id, u.id);
  if (!p) return json(res, 404, { error: '项目不存在' });
  json(res, 200, p);
});

projectRouter.post('/', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const { name, description } = req.body ?? {};
  if (!name?.trim()) return json(res, 400, { error: '项目名不能为空' });
  json(res, 201, ProjectService.create(u.id, { name, description: description ?? '' }));
});

projectRouter.put('/:id', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const p = ProjectService.update(req.params.id, u.id, req.body ?? {});
  if (!p) return json(res, 403, { error: '无权限或项目不存在' });
  json(res, 200, p);
});

projectRouter.delete('/:id', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const ok = ProjectService.delete(req.params.id, u.id);
  json(res, ok ? 200 : 403, { success: ok });
});

projectRouter.get('/:id/members', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const m = ProjectService.listMembers(req.params.id, u.id);
  if (!m) return json(res, 403, { error: '无权限' });
  json(res, 200, m);
});

projectRouter.post('/:id/members', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const { email, role } = req.body ?? {};
  const r = ProjectService.addMember(req.params.id, u.id, email, role);
  json(res, r ? 201 : 400, r ?? { error: '添加失败' });
});

projectRouter.put('/:id/members/:uid', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const { role } = req.body ?? {};
  const r = ProjectService.updateMemberRole(req.params.id, u.id, req.params.uid, role);
  json(res, r ? 200 : 400, r ?? { error: '更新失败' });
});

projectRouter.delete('/:id/members/:uid', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const ok = ProjectService.removeMember(req.params.id, u.id, req.params.uid);
  json(res, ok ? 200 : 400, { success: ok });
});

projectRouter.get('/:id/diagrams', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const list = DiagramService.listByProject(req.params.id, u.id);
  if (!list) return json(res, 403, { error: '无权限' });
  json(res, 200, list);
});
