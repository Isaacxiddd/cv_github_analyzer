// BullMQ worker — processes analysis jobs asynchronously to avoid HTTP timeouts.

import { Worker, type Job } from 'bullmq';

interface AnalysisJobData {
  cvText: string;
  githubUsername: string;
  userId: string;
}

export const QUEUE_NAME = 'analysis';

export function startWorker(redisUrl: string) {
  const worker = new Worker<AnalysisJobData>(
    QUEUE_NAME,
    async (job: Job<AnalysisJobData>) => {
      const { cvText, githubUsername } = job.data;

      await job.updateProgress(10);
      // TODO (v1.0): import extractCV from shared package
      // const cv = extractCV(cvText);

      await job.updateProgress(40);
      // TODO (v1.0): fetch profile
      // const profile = await fetchGitHubProfile(githubUsername);

      await job.updateProgress(70);
      // TODO (v1.0): run cross check
      // const result = runCrossCheck(cv, profile);

      await job.updateProgress(90);
      // TODO (v1.0): generate narrative via Claude
      // const narrative = await generateNarrative(result);

      await job.updateProgress(100);
      return { githubUsername, status: 'done' };
    },
    { connection: { url: redisUrl } }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
