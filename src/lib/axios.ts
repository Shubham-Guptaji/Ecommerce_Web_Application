// src/lib/axios.ts
import axios from 'axios'
import { getSession } from 'next-auth/react'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Note: NextAuth uses cookies for session management. Same-origin requests
// automatically include cookies, so no Authorization header needed.

export default axiosInstance
