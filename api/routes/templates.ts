import { Router } from 'express';
import { AuthService } from '../services/AuthService.js';
import { TemplateService } from '../services/TemplateService.js';
import type { Request, Response } from 'express';
import type { DiagramType } from '../../shared/types.js';

export const templateRouter = Router();

const json = (res: Response, code: number, body: any) => {
  res.status(code).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

templateRouter.get('/', (req: Request, res: Response) => {
  const list = TemplateService.list(req.query.type as DiagramType | undefined, req.query.category as string | undefined);
  json(res, 200, list);
});

templateRouter.get('/:id', (req: Request, res: Response) => {
  const t = TemplateService.getById(req.params.id);
  json(res, t ? 200 : 404, t ?? { error: '不存在' });
});

templateRouter.get('/_/stats', (req: Request, res: Response) => {
  const u = AuthService.authenticate(req.headers.authorization);
  if (!u) return json(res, 401, { error: '未登录' });
  json(res, 200, TemplateService.stats(u.id));
});
