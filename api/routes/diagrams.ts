import { Router } from 'express';
import { AuthService } from '../services/AuthService.js';
import { DiagramService } from '../services/DiagramService.js';
import { CommentService } from '../services/CommentService.js';
import { TemplateService } from '../services/TemplateService.js';
import type { Request, Response } from 'express';

export const diagramRouter = Router();

const json = (res: Response, code: number, body: any) => {
  res.status(code).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const authMiddleware = (req: Request, res: Response) => {
  const u = AuthService.authenticate(req.headers.authorization);
  if (!u) { json(res, 401, { error: '未登录' }); return null; }
  return u;
};

diagramRouter.post('/', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const r = DiagramService.create(u.id, req.body ?? {});
  if (!r) return json(res, 403, { error: '无权限' });
  json(res, 201, r);
});

diagramRouter.get('/:id', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const d = DiagramService.getById(req.params.id, u.id);
  if (!d) return json(res, 404, { error: '不存在或无权限' });
  json(res, 200, d);
});

diagramRouter.put('/:id', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const d = DiagramService.update(req.params.id, u.id, req.body ?? {});
  if (!d) return json(res, 403, { error: '无权限或不存在' });
  json(res, 200, d);
});

diagramRouter.delete('/:id', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const ok = DiagramService.delete(req.params.id, u.id);
  json(res, ok ? 200 : 403, { success: ok });
});

diagramRouter.post('/:id/ops', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const { operations } = req.body ?? {};
  if (!Array.isArray(operations)) return json(res, 400, { error: 'operations无效' });
  const d = DiagramService.applyOperations(req.params.id, u.id, operations);
  if (!d) return json(res, 403, { error: '无权限' });
  json(res, 200, d);
});

diagramRouter.get('/:id/versions', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const list = DiagramService.listVersions(req.params.id, u.id);
  if (!list) return json(res, 403, { error: '无权限' });
  json(res, 200, list);
});

diagramRouter.post('/:id/versions', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const v = DiagramService.createVersion(u.id, req.params.id, req.body ?? {});
  json(res, v ? 201 : 400, v ?? { error: '创建失败' });
});

diagramRouter.post('/:id/versions/:vid/restore', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const d = DiagramService.restoreVersion(req.params.id, u.id, req.params.vid);
  json(res, d ? 200 : 400, d ?? { error: '恢复失败' });
});

diagramRouter.get('/:id/comments', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const list = CommentService.list(req.params.id, u.id);
  if (!list) return json(res, 403, { error: '无权限' });
  json(res, 200, list);
});

diagramRouter.post('/:id/comments', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const c = CommentService.create(req.params.id, u.id, req.body ?? {});
  json(res, c ? 201 : 400, c ?? { error: '创建失败' });
});

diagramRouter.post('/:id/comments/:cid/replies', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const r = CommentService.addReply(req.params.id, req.params.cid, u.id, req.body?.content ?? '');
  json(res, r ? 201 : 400, r ?? { error: '回复失败' });
});

diagramRouter.patch('/:id/comments/:cid', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const c = CommentService.update(req.params.id, req.params.cid, u.id, req.body ?? {});
  json(res, c ? 200 : 400, c ?? { error: '更新失败' });
});

diagramRouter.get('/:id/embed', (req: Request, res: Response) => {
  const u = authMiddleware(req, res); if (!u) return;
  const info = TemplateService.getEmbedInfo(u.id, req.params.id);
  json(res, info ? 200 : 404, info ?? { error: '不存在' });
});

diagramRouter.get('/embed/public/:id', (req: Request, res: Response) => {
  const d = DiagramService.getPublicById(req.params.id);
  if (!d) return json(res, 404, { error: '不存在' });
  json(res, 200, d);
});
