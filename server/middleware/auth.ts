const PUBLIC_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/webhook',
])

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/') || PUBLIC_PATHS.has(event.path)) return

  const user = await getAuthenticatedUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'autenticação necessária' })
  }
})
