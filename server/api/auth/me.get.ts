export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'não autenticado' })
  }

  return { user: { id: user.id, email: user.email } }
})
