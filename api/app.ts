import express, { type Express, json, urlencoded } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { projectRouter } from './routes/projects.js';
import { diagramRouter } from './routes/diagrams.js';
import { templateRouter } from './routes/templates.js';

export const createApp = (): Express => {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    if (!req.url.startsWith('/api')) return next();
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/diagrams', diagramRouter);
  app.use('/api/templates', templateRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), service: 'FlowSync API' });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(err.status ?? 500).json({ error: err.message ?? 'Server Error' });
  });

  return app;
};
