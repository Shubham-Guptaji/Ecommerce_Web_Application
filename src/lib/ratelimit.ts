// src/lib/ratelimit.ts
import { env } from './env'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (use Redis/Upstash in production)
class RateLimiter {
  private records: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60 * 60 * 1000, maxRequests: number = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Clean up old records every minute
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  isLimited(key: string): boolean {
    const now = Date.now()
    const requests = this.records.get(key) || []

    // Remove old requests outside the time window
    const validRequests = requests.filter(time => now - time < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      return true
    }

    validRequests.push(now)
    this.records.set(key, validRequests)
    return false
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, requests] of this.records.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs)
      if (validRequests.length === 0) {
        this.records.delete(key)
      } else {
        this.records.set(key, validRequests)
      }
    }
  }

  getRemaining(key: string): number {
    const now = Date.now()
    const requests = this.records.get(key) || []
    const validRequests = requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  getResetTime(key: string): number {
    const requests = this.records.get(key) || []
    if (requests.length === 0) return 0
    const oldest = Math.min(...requests)
    return oldest + this.windowMs
  }
}

// Create rate limiters for different endpoints
export const registerRateLimiter = new RateLimiter(60 * 60 * 1000, 5) // 5 registrations per hour
export const forgotPasswordRateLimiter = new RateLimiter(60 * 60 * 1000, 3) // 3 password resets per hour per email
export const loginRateLimiter = new RateLimiter(15 * 60 * 1000, 10) // 10 login attempts per 15 minutes

// Helper function to check rate limit
export const checkRateLimit = (
  limiter: RateLimiter,
  key: string,
  { skipCheck = false }: { skipCheck?: boolean } = {}
): { limited: boolean; remaining: number; resetTime: number } => {
  if (skipCheck || process.env.NODE_ENV === 'development') {
    return { limited: false, remaining: 100, resetTime: 0 }
  }

  const limited = limiter.isLimited(key)
  return {
    limited,
    remaining: limiter.getRemaining(key),
    resetTime: limiter.getResetTime(key),
  }
}

// Get client IP from request (works with Vercel, standard proxies)
export const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback for development or direct connections
  return '127.0.0.1'
}
