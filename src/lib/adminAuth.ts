// File path: src/lib/adminAuth.ts
import { NextResponse } from 'next/server'
import { dbConnect } from './db'
import { auth } from './auth'

export async function requireAdmin() {
  try {
    await dbConnect()
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return {
        session: null,
        error: NextResponse.json(
          { success: false, message: 'Unauthorized. Admin access required.' },
          { status: 403 }
        ),
      }
    }

    return { session, error: null }
  } catch (error) {
    console.error('Admin auth error:', error)
    return {
      session: null,
      error: NextResponse.json(
        { success: false, message: 'Authentication error' },
        { status: 500 }
      ),
    }
  }
}
