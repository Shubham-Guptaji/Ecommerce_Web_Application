// File path: src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'

export async function GET() {
  try {
    await dbConnect()

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'Service is healthy',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}
