import { and, eq, gt, gte, lte, notExists } from "drizzle-orm"
import { db } from "../db"
import { chapter, project, sentEmail, user, work } from "../db/schema"

export const REENGAGEMENT_EMAIL_TYPE = "reengagement_nudge"

// Wait long enough that the signup momentum is truly gone, but not so long
// the account feels stale. The upper bound also keeps the cron from blasting
// the historical backlog of inactive accounts when it first ships.
const MIN_ACCOUNT_AGE_DAYS = 3
const MAX_ACCOUNT_AGE_DAYS = 21

// Safety cap per daily run; anyone over the cap is picked up the next day.
export const MAX_EMAILS_PER_RUN = 25

const DAY_MS = 24 * 60 * 60 * 1000

export interface ReengagementCandidate {
  email: string
  id: string
  name: string
}

/**
 * Verified users who signed up 3–21 days ago, have never written a word in
 * any project they own, and haven't received this nudge before.
 */
export async function findReengagementCandidates(now: Date): Promise<ReengagementCandidate[]> {
  const newestEligibleSignup = new Date(now.getTime() - MIN_ACCOUNT_AGE_DAYS * DAY_MS)
  const oldestEligibleSignup = new Date(now.getTime() - MAX_ACCOUNT_AGE_DAYS * DAY_MS)

  return await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(
      and(
        eq(user.emailVerified, true),
        lte(user.createdAt, newestEligibleSignup),
        gte(user.createdAt, oldestEligibleSignup),
        notExists(
          db
            .select({ id: sentEmail.id })
            .from(sentEmail)
            .where(and(eq(sentEmail.userId, user.id), eq(sentEmail.type, REENGAGEMENT_EMAIL_TYPE)))
        ),
        notExists(
          db
            .select({ id: chapter.id })
            .from(chapter)
            .innerJoin(work, eq(chapter.workId, work.id))
            .innerJoin(project, eq(work.projectId, project.id))
            .where(and(eq(project.ownerId, user.id), gt(chapter.wordCount, 0)))
        )
      )
    )
    .limit(MAX_EMAILS_PER_RUN)
}

/**
 * Record the nudge before sending so a crashed run can never double-send;
 * a missed email costs nothing, a duplicate one reads as spam.
 */
export async function markReengagementSent(userId: string, now: Date): Promise<void> {
  await db.insert(sentEmail).values({
    id: crypto.randomUUID(),
    userId,
    type: REENGAGEMENT_EMAIL_TYPE,
    sentAt: now,
  })
}
