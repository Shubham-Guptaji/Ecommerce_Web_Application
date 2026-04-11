// File path: src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await dbConnect()

        const user = await User.findOne({ email: credentials.email }).select('+password')
        if (!user) {
          return null
        }

        if (!user.password) {
          return null
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
          return null
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
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id.toString()
        token.role = user.role
        token.isEmailVerified = user.isEmailVerified
      }
      return token
    },
    async session({ session, token }) {
      // Cast token to include our custom fields
      const customToken = token as {
        _id?: string
        role?: 'user' | 'admin'
        isEmailVerified?: boolean
      } | null | undefined
      if (session.user && customToken?._id) {
        session.user.id = customToken._id
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
        console.error('Failed to update lastLogin:', error)
      }
    },
  },
})

export const authConfig = auth
