// src/lib/ratelimit.ts
import { env } from './env'
import { getRedisClient } from './redis'

type RateLimitResult = {
  limited: boolean
  remaining: number
  resetTime: number
}

class RedisRateLimiter {
  private readonly windowMs: number
  private readonly maxRequests: number
  private readonly keyPrefix: string

  constructor(keyPrefix: string, windowMs: number = 60 * 60 * 1000, maxRequests: number = 10) {
    const namespace = env.REDIS_KEY_PREFIX || 'ecom'
    this.keyPrefix = `${namespace}:${keyPrefix}`
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  private buildKey(key: string) {
    const safeKey = encodeURIComponent(key)
    const window = Math.floor(Date.now() / this.windowMs)
    return `${this.keyPrefix}:${window}:${safeKey}`
  }

  async check(key: string): Promise<RateLimitResult> {
    const client = await getRedisClient()

    if (!client) {
      // Fail open if Redis is not configured so auth routes still work locally.
      return { limited: false, remaining: this.maxRequests, resetTime: 0 }
    }

    const redisKey = this.buildKey(key)
    const now = Date.now()
    const count = await client.incr(redisKey)

    let ttl = await client.pTTL(redisKey)
    if (count === 1 || ttl < 0) {
      await client.pExpire(redisKey, this.windowMs)
      ttl = this.windowMs
    }

    const result = {
      limited: count > this.maxRequests,
      remaining: Math.max(0, this.maxRequests - count),
      resetTime: ttl > 0 ? now + ttl : 0,
    }

    // Temporary debug log for local verification. Safe to delete after checking requests.
    if (env.NODE_ENV !== 'production') {
      console.log('[rate-limit]', {
        key: redisKey,
        count,
        maxRequests: this.maxRequests,
        limited: result.limited,
        remaining: result.remaining,
      })
    }

    return result
  }
}

// Create rate limiters for different endpoints
export const registerRateLimiter = new RedisRateLimiter('ratelimit:register', 60 * 60 * 1000, 5)
export const forgotPasswordRateLimiter = new RedisRateLimiter('ratelimit:forgot-password', 60 * 60 * 1000, 3)
export const resendVerificationRateLimiter = new RedisRateLimiter('ratelimit:resend-verification', 60 * 60 * 1000, 3)
export const loginRateLimiter = new RedisRateLimiter('ratelimit:login', 15 * 60 * 1000, 10)
export const contactRateLimiter = new RedisRateLimiter('ratelimit:contact', 60 * 60 * 1000, 5)
export const newsletterSubscribeRateLimiter = new RedisRateLimiter('ratelimit:newsletter-subscribe', 60 * 60 * 1000, 5)

// Helper function to check rate limit
export const checkRateLimit = async (
  limiter: RedisRateLimiter,
  key: string,
  { skipCheck = false }: { skipCheck?: boolean } = {}
): Promise<RateLimitResult> => {
  if (skipCheck) {
    return { limited: false, remaining: 100, resetTime: 0 }
  }

  return limiter.check(key)
}

function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback for development or direct connections
  return '127.0.0.1'
}

// Get client IP from Request / NextRequest / Headers.
export const getClientIp = (requestOrHeaders: Request | Headers | { headers: Headers }): string => {
  if (requestOrHeaders instanceof Headers) {
    return getClientIpFromHeaders(requestOrHeaders)
  }

  return getClientIpFromHeaders(requestOrHeaders.headers)
}
