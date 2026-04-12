import { createClient } from 'redis'
import { env } from './env'

type AppRedisClient = ReturnType<typeof createClient>

type RedisCache = {
  client: AppRedisClient | null
  connectPromise: Promise<AppRedisClient> | null
  configWarningShown: boolean
}

const globalForRedis = globalThis as typeof globalThis & {
  __redisCache?: RedisCache
}

function getRedisCache(): RedisCache {
  if (!globalForRedis.__redisCache) {
    globalForRedis.__redisCache = {
      client: null,
      connectPromise: null,
      configWarningShown: false,
    }
  }

  return globalForRedis.__redisCache
}

function buildRedisUrl() {
  if (env.REDIS_URL) {
    return env.REDIS_URL
  }

  if (!env.REDIS_HOST) {
    return undefined
  }

  const protocol = env.REDIS_TLS ? 'rediss' : 'redis'
  const username = env.REDIS_USERNAME ? encodeURIComponent(env.REDIS_USERNAME) : ''
  const password = env.REDIS_PASSWORD ? `:${encodeURIComponent(env.REDIS_PASSWORD)}` : ''
  const auth = username || password ? `${username}${password}@` : ''
  const port = env.REDIS_PORT ?? 6379
  const database = env.REDIS_DB ?? 0

  return `${protocol}://${auth}${env.REDIS_HOST}:${port}/${database}`
}

export function isRedisConfigured() {
  return Boolean(buildRedisUrl())
}

export async function getRedisClient() {
  const cache = getRedisCache()

  if (cache.client?.isOpen) {
    return cache.client
  }

  const url = buildRedisUrl()
  if (!url) {
    if (!cache.configWarningShown) {
      console.warn('Redis is not configured. Set REDIS_URL or REDIS_HOST to enable Redis-backed rate limiting.')
      cache.configWarningShown = true
    }
    return null
  }

  if (!cache.connectPromise) {
    const client = createClient({ url })

    client.on('error', (error) => {
      console.error('Redis client error:', error)
    })

    cache.connectPromise = client.connect().then(() => {
      cache.client = client
      return client
    }).catch((error) => {
      cache.connectPromise = null
      throw error
    })
  }

  return cache.connectPromise
}
