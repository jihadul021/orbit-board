import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  password: z.string().min(1, 'Password is required')
})

export const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').trim()
})

export const updateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').trim()
})

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address').trim()
})

export const createBoardSchema = z.object({
  name: z.string().min(2, 'Board name must be at least 2 characters').trim(),
  groupId: z.string().min(1, 'Group ID is required')
})

export const updateBoardSchema = z.object({
  name: z.string().min(2, 'Board name must be at least 2 characters').trim()
})

export const addBoardMemberSchema = z.object({
  email: z.string().email('Invalid email address').trim(),
  role: z.enum(['writer', 'editor']).default('writer')
})

export const updateRoleSchema = z.object({
  role: z.enum(['writer', 'editor'])
})

export const createListSchema = z.object({
  name: z.string().min(1, 'List name is required').trim(),
  boardId: z.string().min(1, 'Board ID is required')
})

export const updateListSchema = z.object({
  name: z.string().min(1, 'List name is required').trim()
})

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  listId: z.string().min(1, 'List ID is required')
})

export const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').trim().optional(),
  body: z.any().optional()
})

export const updateArticleStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'in_review', 'reviewed', 'published'])
})

export const moveArticleSchema = z.object({
  listId: z.string().min(1, 'List ID is required')
})

export const addCommentSchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  body: z.string().min(1, 'Comment cannot be empty').trim(),
  parentId: z.string().optional()
})
