import type { FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (app) => {
  // GitHub OAuth callback — exchange code for token, upsert user in DB
  app.get('/auth/github/callback', async (req, reply) => {
    // TODO (v1.0): exchange code, upsert user, return JWT session
    return reply.status(501).send({ error: 'Not implemented' });
  });

  app.post('/auth/logout', async (_req, reply) => {
    // TODO (v1.0): invalidate session
    return reply.status(501).send({ error: 'Not implemented' });
  });
};
