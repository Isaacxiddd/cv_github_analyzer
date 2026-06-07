import type { FastifyPluginAsync } from 'fastify';

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.get('/reports/:id', async (req, reply) => {
    // TODO (v1.0): fetch from DB by id, check ownership
    return reply.status(501).send({ error: 'Not implemented' });
  });

  app.get('/reports', async (req, reply) => {
    // TODO (v1.0): paginated list for authenticated user
    return reply.status(501).send({ error: 'Not implemented' });
  });
};
