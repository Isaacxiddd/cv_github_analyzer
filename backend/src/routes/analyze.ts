import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const BodySchema = z.object({
  cvText:         z.string().min(100).max(50_000),
  githubUsername: z.string().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/),
});

export const analyzeRoutes: FastifyPluginAsync = async (app) => {
  app.post('/analyze', async (req, reply) => {
    const body = BodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    // TODO (v1.0): enqueue BullMQ job, return job id
    // const jobId = await analysisQueue.add('analyze', body.data);
    // return reply.status(202).send({ jobId });

    return reply.status(501).send({ error: 'Backend analysis not yet implemented. Use the extension.' });
  });

  app.get('/analyze/:jobId', async (req, reply) => {
    // TODO (v1.0): poll job status from BullMQ / DB
    return reply.status(501).send({ error: 'Not implemented' });
  });
};
