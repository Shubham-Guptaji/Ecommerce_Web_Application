// src/lib/axios.ts
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { getSiteUrl } from './site-url'

// For API calls to our own backend, use relative URL on client to avoid CORS issues
// getSiteUrl() is safe to use on server, but on client we want relative URLs
const BASE_URL = typeof window !== 'undefined' ? undefined : getSiteUrl()

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Note: NextAuth uses cookies for session management. Same-origin requests
// automatically include cookies, so no Authorization header needed.

export default axiosInstance
