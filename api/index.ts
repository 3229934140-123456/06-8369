import { createApp } from './app.js';
import { createServer } from 'http';
import { setupCollaborationServer } from './services/CollabService.js';

const PORT = Number(process.env.PORT ?? 3001);

export const start = () => {
  const app = createApp();
  const server = createServer(app);

  setupCollaborationServer(server);

  server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║  FlowSync API Server                           ║
║  • HTTP:  http://localhost:${PORT}/api            ║
║  • WS:    ws://localhost:${PORT}/collab           ║
║  • Health: http://localhost:${PORT}/api/health    ║
╚════════════════════════════════════════════════╝
`);
  });

  return server;
};
