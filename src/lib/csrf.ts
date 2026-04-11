// File path: src/lib/csrf.ts
import { NextRequest, NextResponse } from 'next/server'
import { env } from './env'

/**
 * Verify that the request Origin header matches the expected NEXTAUTH_URL
 * This helps prevent CSRF attacks on state-changing operations
 */
export function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('Origin')
  const referer = request.headers.get('Referer')

  if (!origin && !referer) {
    // No origin or referer - could be a non-browser request
    // In production, you may want to reject these
    return true
  }

  const expectedOrigin = env.NEXTAUTH_URL.replace(/\/$/, '') // remove trailing slash
  const requestOrigin = origin || (referer ? new URL(referer).origin : '')

  return requestOrigin === expectedOrigin
}

/**
 * Create a middleware handler that checks CSRF origin
 * Use at the beginning of sensitive POST/PUT/DELETE routes
 */
export async function requireCSRF(
  request: NextRequest
): Promise<{ valid: boolean; response?: NextResponse }> {
  if (!verifyOrigin(request)) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, message: 'Invalid origin' },
        { status: 403 }
      ),
    }
  }

  return { valid: true }
}
