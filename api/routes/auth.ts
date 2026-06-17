import { Router } from 'express';
import { AuthService } from '../services/AuthService.js';
import type { Request, Response } from 'express';

export const authRouter = Router();

const json = (res: Response, code: number, body: any) => {
  res.status(code).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  const result = AuthService.login(email ?? '', password ?? '');
  if (!result) return json(res, 401, { error: '登录失败' });
  json(res, 200, result);
});

authRouter.get('/me', (req: Request, res: Response) => {
  const user = AuthService.authenticate(req.headers.authorization);
  if (!user) return json(res, 401, { error: '未登录' });
  json(res, 200, user);
});

authRouter.get('/users', (req: Request, res: Response) => {
  const user = AuthService.authenticate(req.headers.authorization);
  if (!user) return json(res, 401, { error: '未登录' });
  json(res, 200, AuthService.listAllUsers());
});
