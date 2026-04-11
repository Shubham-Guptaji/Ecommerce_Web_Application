import 'next-auth'
import '@auth/core/jwt'

declare module 'next-auth' {
  interface User {
    _id: string
    role: 'user' | 'admin'
    isEmailVerified: boolean
  }

  interface Session {
    user: {
      id: string
      role: 'user' | 'admin'
      isEmailVerified: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    _id?: string
    role?: 'user' | 'admin'
    isEmailVerified?: boolean
  }
}
