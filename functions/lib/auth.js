import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

// Rate limit en memoria por isolate (suficiente para un solo usuario)
const rateLimitStore = new Map()

/**
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * @param {object} env
 * @returns {Promise<string>}
 */
export async function signSession(env) {
  const secret = new TextEncoder().encode(env.SESSION_SECRET)
  return new SignJWT({ v: parseInt(env.SESSION_VERSION || '1') })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

/**
 * @param {string} token
 * @param {object} env
 * @returns {Promise<object|null>}
 */
async function verifyToken(token, env) {
  try {
    const secret = new TextEncoder().encode(env.SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret)
    if (payload.v !== parseInt(env.SESSION_VERSION || '1')) return null
    return payload
  } catch {
    return null
  }
}

/**
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<object|null>}
 */
export async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  return verifyToken(match[1], env)
}

/**
 * @param {string} token
 * @returns {string}
 */
export function buildSessionCookie(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`
}

/** @returns {string} */
export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

/**
 * Máx 3 intentos / 10 min / IP, luego bloqueo de 5 min.
 * @param {string} ip
 * @returns {{ allowed: boolean, retryAfter?: number }}
 */
export function checkRateLimit(ip) {
  const now = Date.now()
  const key = `rl:${ip}`
  const entry = rateLimitStore.get(key) || { count: 0, firstAt: now, blockedUntil: 0 }

  if (entry.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) }
  }

  if (now - entry.firstAt > 10 * 60 * 1000) {
    entry.count = 0
    entry.firstAt = now
  }

  if (entry.count >= 3) {
    entry.blockedUntil = now + 5 * 60 * 1000
    rateLimitStore.set(key, entry)
    return { allowed: false, retryAfter: 300 }
  }

  return { allowed: true }
}

/** @param {string} ip */
export function recordFailedAttempt(ip) {
  const now = Date.now()
  const key = `rl:${ip}`
  const entry = rateLimitStore.get(key) || { count: 0, firstAt: now, blockedUntil: 0 }
  entry.count++
  rateLimitStore.set(key, entry)
}

/** @param {string} ip */
export function clearAttempts(ip) {
  rateLimitStore.delete(`rl:${ip}`)
}
