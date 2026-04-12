const LOCAL_DEV_URL = 'http://localhost:3000'

function trimTrailingSlash(url: string) {
  return url.replace(/\/$/, '')
}

function isLocalhostUrl(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimTrailingSlash(url))
}

function normalizeCandidate(url?: string) {
  if (!url) {
    return undefined
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return undefined
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimTrailingSlash(trimmed)
  }

  return trimTrailingSlash(`https://${trimmed}`)
}

export function getSiteUrl() {
  const candidates = [
    normalizeCandidate(process.env.NEXTAUTH_URL),
    normalizeCandidate(process.env.NEXT_PUBLIC_APP_URL),
    normalizeCandidate(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    normalizeCandidate(process.env.VERCEL_URL),
  ].filter((value): value is string => Boolean(value))

  const preferredUrl = candidates.find((candidate) => {
    return process.env.NODE_ENV !== 'production' || !isLocalhostUrl(candidate)
  })

  return preferredUrl ?? LOCAL_DEV_URL
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return undefined
  }

  return getSiteUrl()
}
