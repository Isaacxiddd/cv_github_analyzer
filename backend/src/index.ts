// Entry point — thin orchestrator. All logic lives in routes/ and services/.
// Max rule: this file stays under 300 lines. Add routes via register(), never inline.

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { analyzeRoutes } from './routes/analyze.js';
import { reportRoutes } from './routes/reports.js';
import { authRoutes } from './routes/auth.js';

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
});

await app.register(cors, {
  origin: process.env.ALLOWED_ORIGIN ?? false,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

await app.register(analyzeRoutes, { prefix: '/api/v1' });
await app.register(reportRoutes,  { prefix: '/api/v1' });
await app.register(authRoutes,    { prefix: '/api/v1' });

app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT ?? 3001),
      host: '0.0.0.0',
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
