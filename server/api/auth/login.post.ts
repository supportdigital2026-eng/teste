interface LoginBody {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body?.email?.trim().toLowerCase()
  const password = body?.password

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'e-mail e senha são obrigatórios' })
  }

  const { data, error } = await useSupabaseServer().auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    throw createError({ statusCode: 401, statusMessage: 'e-mail ou senha inválidos' })
  }

  setAuthCookie(event, data.session.access_token, data.session.expires_in ?? 3600)
  return { user: { id: data.user.id, email: data.user.email } }
})
