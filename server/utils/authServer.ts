import type { H3Event } from 'h3'
import type { User } from '@supabase/supabase-js'

const ACCESS_COOKIE = 'sb-access-token'

export async function getAuthenticatedUser(event: H3Event): Promise<User | null> {
  const token = getCookie(event, ACCESS_COOKIE) || getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null

  const { data, error } = await useSupabaseServer().auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export function setAuthCookie(event: H3Event, accessToken: string, expiresIn: number) {
  setCookie(event, ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, ACCESS_COOKIE, { path: '/' })
}
