import { sendActionEmail } from "./lib/email"
import { findReengagementCandidates, markReengagementSent } from "./lib/reengagement"

const APP_URL = "https://openwrite.iliareingold.com"

// Deliberately impersonal copy: user names are free-form text and the email
// template interpolates the body into HTML unescaped.
const NUDGE = {
  subject: "Your first chapter is still waiting",
  body: "You signed up for OpenWrite a few days ago, but your story hasn't started yet. Open your project and the editor will set up Chapter 1 for you — all that's missing is the first sentence.",
  actionLabel: "Start writing",
  actionUrl: `${APP_URL}/dashboard`,
}

async function sendNudge(candidate: { email: string; id: string }, now: Date): Promise<void> {
  // Mark first: a duplicate nudge reads as spam, a missed one costs nothing.
  await markReengagementSent(candidate.id, now)
  await sendActionEmail({ ...NUDGE, to: candidate.email })
}

/** Daily sweep: nudge signups who never wrote anything. */
export async function runScheduledJobs(now: Date): Promise<void> {
  const candidates = await findReengagementCandidates(now)
  if (candidates.length === 0) {
    return
  }

  const results = await Promise.allSettled(candidates.map((candidate) => sendNudge(candidate, now)))
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(`Re-engagement nudge failed for user ${candidates[index].id}:`, result.reason)
    }
  }
}
