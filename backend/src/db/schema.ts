import { pgTable, uuid, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'pro']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'done', 'failed']);

export const users = pgTable('users', {
  id:          uuid('id').primaryKey().defaultRandom(),
  githubId:    text('github_id').notNull().unique(),
  email:       text('email'),
  username:    text('username').notNull(),
  plan:        planEnum('plan').default('free').notNull(),
  monthlyUsed: integer('monthly_used').default(0).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
});

export const reports = pgTable('reports', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').references(() => users.id).notNull(),
  cvHash:         text('cv_hash').notNull(),
  githubUsername: text('github_username').notNull(),
  resultJson:     jsonb('result_json').notNull(),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
});

export const analysisJobs = pgTable('analysis_jobs', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').references(() => users.id).notNull(),
  status:      jobStatusEnum('status').default('pending').notNull(),
  payload:     jsonb('payload').notNull(),
  resultId:    uuid('result_id').references(() => reports.id),
  error:       text('error'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const plans = pgTable('plans', {
  id:           uuid('id').primaryKey().defaultRandom(),
  name:         planEnum('name').notNull(),
  priceUsd:     integer('price_usd').notNull(),
  monthlyLimit: integer('monthly_limit').notNull(),
});
