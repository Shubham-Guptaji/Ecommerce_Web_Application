import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'
import Setting from '@/models/Setting'
import { z } from 'zod'

const settingsSchema = z.object({
  storeName: z.string().min(1),
  storeEmail: z.string().email(),
  storeLogo: z.object({
    url: z.string().url().optional(),
    publicId: z.string().optional(),
  }).optional(),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  freeDeliveryThreshold: z.number().min(0),
  deliveryCharge: z.number().min(0),
  expressDeliveryCharge: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  maintenanceMode: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    // Get or create settings (singleton)
    let settings = await Setting.findOne({})
    if (!settings) {
      settings = new Setting()
      await settings.save()
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = settingsSchema.parse(body)

    // Get or create settings
    let settings = await Setting.findOne({})
    if (!settings) {
      settings = new Setting()
    }

    // Update fields
    Object.assign(settings, validated)

    await settings.save()

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings,
    })
  } catch (error: any) {
    console.error('Settings PUT error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
