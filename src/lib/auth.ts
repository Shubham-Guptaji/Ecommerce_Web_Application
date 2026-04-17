// File path: src/lib/auth.ts
import NextAuth from 'next-auth'
import { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { dbConnect } from '@/lib/db'
import { logger } from '@/lib/logger'
import User from '@/models/User'
import { checkRateLimit, getClientIp, loginRateLimiter } from '@/lib/ratelimit'
import { isMaintenanceModeEnabled } from '@/lib/settings'

class RateLimitSignInError extends CredentialsSignin {
  code = 'rate_limit'
}

class UnverifiedEmailSignInError extends CredentialsSignin {
  code = 'unverified'
}

class MaintenanceModeSignInError extends CredentialsSignin {
  code = 'maintenance_mode'
}

class InactiveAccountSignInError extends CredentialsSignin {
  code = 'inactive'
}

const nextAuthConfig = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, request) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const clientIp = getClientIp(request)
        const email = String(credentials.email).trim().toLowerCase()
        const rateLimitKey = `${clientIp}:${email}`
        const { limited } = await checkRateLimit(loginRateLimiter, rateLimitKey)

        if (limited) {
          throw new RateLimitSignInError()
        }

        await dbConnect()

        const user = await User.findOne({ email }).select('+password')
        if (!user) {
          return null
        }

        if (!user.password) {
          return null
        }

        if (!user.isActive) {
          throw new InactiveAccountSignInError()
        }

        const isValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          return null
        }

        // Reject if email is not verified
        if (!user.isEmailVerified) {
          throw new UnverifiedEmailSignInError()
        }

        if (await isMaintenanceModeEnabled() && user.role !== 'admin') {
          throw new MaintenanceModeSignInError()
        }

        return {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        await dbConnect()

        let dbUser = await User.findOne({ email: user.email })

        if (!dbUser) {
          dbUser = await User.create({
            name: user.name || user.email.split('@')[0],
            email: user.email,
            role: 'user',
            isActive: true,
            isEmailVerified: true,
            avatar: user.image
              ? {
                  url: user.image,
                  publicId: '',
                }
              : undefined,
          })
        } else {
          const updates: {
            name?: string
            avatar?: { url: string; publicId: string }
            isEmailVerified?: boolean
          } = {}

          if (!dbUser.name && user.name) {
            updates.name = user.name
          }

          if ((!dbUser.avatar?.url || dbUser.avatar.url !== user.image) && user.image) {
            updates.avatar = {
              url: user.image,
              publicId: dbUser.avatar?.publicId || '',
            }
          }

          if (!dbUser.isEmailVerified) {
            updates.isEmailVerified = true
          }

          if (Object.keys(updates).length > 0) {
            dbUser = await User.findByIdAndUpdate(dbUser._id, updates, {
              new: true,
            })
          }
        }

        if (!dbUser) {
          return false
        }

        if (!dbUser.isActive) {
          return '/sign-in?error=inactive'
        }

        user.id = dbUser._id.toString()
        user._id = dbUser._id.toString()
        user.role = dbUser.role
        user.isEmailVerified = dbUser.isEmailVerified
      }

      if (!(await isMaintenanceModeEnabled())) {
        return true
      }

      if (user.role === 'admin') {
        return true
      }

      await dbConnect()

      const dbUser = user.email
        ? await User.findOne({ email: user.email }).select('role')
        : null

      if (dbUser?.role === 'admin') {
        return true
      }

      return '/sign-in?error=maintenance_mode&maintenance=1'
    },
    async jwt({ token, user }) {
      if (user) {
        const userId = user._id?.toString?.() || user.id?.toString?.()

        if (userId) {
          token._id = userId
          token.sub = userId
        }

        if (user.role) token.role = user.role
        if (user.isEmailVerified !== undefined) token.isEmailVerified = user.isEmailVerified
      }

      const tokenUserId = token._id?.toString?.() || token.sub?.toString?.()
      if (tokenUserId && /^[0-9a-fA-F]{24}$/.test(tokenUserId)) {
        await dbConnect()
        const dbUser = await User.findById(tokenUserId)
          .select('role isEmailVerified isActive')
          .lean() as { role?: 'user' | 'admin'; isEmailVerified?: boolean; isActive?: boolean } | null

        if (!dbUser || dbUser.isActive === false) {
          token.deactivated = true
          return token
        }

        token.deactivated = false
        if (dbUser.role) token.role = dbUser.role
        if (dbUser.isEmailVerified !== undefined) token.isEmailVerified = dbUser.isEmailVerified
      }

      return token
    },
    async session({ session, token }) {
      // Cast token to include our custom fields
      const customToken = token as {
        _id?: string
        role?: 'user' | 'admin'
        isEmailVerified?: boolean
        deactivated?: boolean
      } | null | undefined

      if (customToken?.deactivated) {
        return null as any
      }

      const sessionUserId = customToken?._id || token.sub

      if (session.user && sessionUserId) {
        session.user.id = sessionUserId
        if (customToken?.role) session.user.role = customToken.role
        if (customToken?.isEmailVerified !== undefined) session.user.isEmailVerified = customToken.isEmailVerified
      }
      return session
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  events: {
    signIn: async ({ user }) => {
      try {
        await dbConnect()
        // Only update if user.id is a valid ObjectId
        if (user.id && /^[0-9a-fA-F]{24}$/.test(user.id)) {
          await User.findByIdAndUpdate(user.id, { lastLogin: new Date() })
        }
      } catch (error) {
        logger.error('Failed to update lastLogin', error)
      }
    },
  },
})

const rawAuth = nextAuthConfig.auth

export const handlers = nextAuthConfig.handlers
export const signIn = nextAuthConfig.signIn
export const signOut = nextAuthConfig.signOut
export const auth = (async (...args: any[]) => {
  const session = await (rawAuth as any)(...args)
  const sessionUser = (session as any)?.user

  if (!sessionUser?.id || !/^[0-9a-fA-F]{24}$/.test(sessionUser.id)) {
    return session
  }

  await dbConnect()
  const dbUser = await User.findById(sessionUser.id)
    .select('role isEmailVerified isActive')
    .lean() as { role?: 'user' | 'admin'; isEmailVerified?: boolean; isActive?: boolean } | null

  if (!dbUser || dbUser.isActive === false) {
    return null
  }

  if (dbUser.role) {
    sessionUser.role = dbUser.role
  }
  if (dbUser.isEmailVerified !== undefined) {
    sessionUser.isEmailVerified = dbUser.isEmailVerified
  }

  return session
}) as any

export const authConfig = auth
