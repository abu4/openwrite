import { asc, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { chapter, project, work } from "../db/schema"
import { countWordsInHtml } from "../lib/word-count"
import { requireAuth, verifyProjectAccess } from "../middleware/auth"

interface Env {
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
}

interface Variables {
  activeOrganization: {
    id: string
    name: string
    slug: string
  } | null
  session: {
    id: string
    userId: string
  }
  user: {
    id: string
    email: string
    name: string
  }
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>

// Keep documents well under D1's row size limits
const MAX_CONTENT_BYTES = 1_000_000

const PROJECT_TYPE_TO_WORK_TYPE = {
  novel: "novel",
  trilogy: "novel",
  series: "novel",
  short_story_collection: "short_story",
  graphic_novel: "graphic_novel",
  screenplay: "screenplay",
} as const

const contentRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

async function findPrimaryChapter(projectId: string) {
  const primaryWork = await db
    .select({ id: work.id })
    .from(work)
    .where(eq(work.projectId, projectId))
    .orderBy(asc(work.order), asc(work.createdAt))
    .limit(1)
    .get()

  if (!primaryWork) {
    return null
  }

  const primaryChapter = await db
    .select({
      id: chapter.id,
      content: chapter.content,
      wordCount: chapter.wordCount,
      updatedAt: chapter.updatedAt,
    })
    .from(chapter)
    .where(eq(chapter.workId, primaryWork.id))
    .orderBy(asc(chapter.order), asc(chapter.createdAt))
    .limit(1)
    .get()

  return { workId: primaryWork.id, chapter: primaryChapter ?? null }
}

// Get the writing content for a project (primary chapter of the primary work)
contentRouter.get(
  "/projects/:projectId/content",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = c.req.param("projectId")
    if (!projectId) {
      return c.json({ error: "Project ID is required" }, 400)
    }

    const existing = await findPrimaryChapter(projectId)

    if (!existing?.chapter) {
      return c.json({
        chapterId: null,
        content: "",
        wordCount: 0,
        updatedAt: null,
      })
    }

    return c.json({
      chapterId: existing.chapter.id,
      content: existing.chapter.content ?? "",
      wordCount: existing.chapter.wordCount ?? 0,
      updatedAt: existing.chapter.updatedAt.toISOString(),
    })
  }
)

// Save the writing content for a project, lazily creating the work/chapter
contentRouter.put(
  "/projects/:projectId/content",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = c.req.param("projectId")
    if (!projectId) {
      return c.json({ error: "Project ID is required" }, 400)
    }

    let content: unknown
    try {
      const body = await c.req.json()
      content = body.content
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    if (typeof content !== "string") {
      return c.json({ error: "Content must be a string" }, 400)
    }

    if (new TextEncoder().encode(content).length > MAX_CONTENT_BYTES) {
      return c.json({ error: "Content is too large" }, 413)
    }

    const projectData = await db
      .select({ id: project.id, title: project.title, type: project.type })
      .from(project)
      .where(eq(project.id, projectId))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    const wordCount = countWordsInHtml(content)
    const now = new Date()

    try {
      const existing = await findPrimaryChapter(projectId)

      let chapterId: string

      if (existing?.chapter) {
        chapterId = existing.chapter.id
        await db
          .update(chapter)
          .set({ content, wordCount, updatedAt: now })
          .where(eq(chapter.id, chapterId))
      } else {
        let workId = existing?.workId

        if (!workId) {
          workId = crypto.randomUUID()
          await db.insert(work).values({
            id: workId,
            projectId,
            title: projectData.title,
            workType: PROJECT_TYPE_TO_WORK_TYPE[projectData.type],
            order: 1,
            currentWordCount: 0,
            status: "draft",
            createdAt: now,
            updatedAt: now,
          })
        }

        chapterId = crypto.randomUUID()
        await db.insert(chapter).values({
          id: chapterId,
          title: "Chapter 1",
          content,
          wordCount,
          order: 1,
          status: "draft",
          workId,
          createdAt: now,
          updatedAt: now,
        })
      }

      await db
        .update(project)
        .set({ currentWordCount: wordCount, lastWrittenAt: now, updatedAt: now })
        .where(eq(project.id, projectId))

      return c.json({
        success: true,
        chapterId,
        wordCount,
        savedAt: now.toISOString(),
      })
    } catch {
      return c.json({ error: "Failed to save content" }, 500)
    }
  }
)

export { contentRouter }
