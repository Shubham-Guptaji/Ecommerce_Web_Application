import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary'
import { auth } from '@/lib/auth'
import { env, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_FOLDER } from '@/lib/env'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

const USER_UPLOAD_FOLDERS = new Set(['avatars'])
const ADMIN_UPLOAD_FOLDERS = new Set(['products', 'categories', 'store'])

function normalizeUploadFolder(value: FormDataEntryValue | null) {
  const folder = typeof value === 'string' && value.trim()
    ? value.trim()
    : CLOUDINARY_UPLOAD_FOLDER

  if (!/^[a-z0-9/_-]+$/i.test(folder) || folder.includes('..')) {
    return null
  }

  return folder.replace(/^\/+|\/+$/g, '')
}

function getTopLevelFolder(publicId: string) {
  return publicId.split('/').filter(Boolean)[0] || ''
}

function isAdminUploadFolder(folder: string) {
  return ADMIN_UPLOAD_FOLDERS.has(folder)
}

function canUseUploadFolder(folder: string, role?: string) {
  return USER_UPLOAD_FOLDERS.has(folder) || (role === 'admin' && isAdminUploadFolder(folder))
}

function canDeleteUploadedAsset(publicId: string, role?: string) {
  const folder = getTopLevelFolder(publicId)
  return role === 'admin' && (USER_UPLOAD_FOLDERS.has(folder) || isAdminUploadFolder(folder))
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = normalizeUploadFolder(formData.get('folder'))

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    if (!folder || !canUseUploadFolder(folder, session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Upload folder is not allowed' },
        { status: 403 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only JPEG, PNG, WEBP, GIF, AVIF allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File size too large. Max 5MB' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadOptions: UploadApiOptions = {
      resource_type: 'image',
      folder,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    }

    if (CLOUDINARY_UPLOAD_PRESET) {
      uploadOptions.upload_preset = CLOUDINARY_UPLOAD_PRESET
    }

    const response = await new Promise<Response>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error)
            return
          }

          if (!result) {
            reject(new Error('Upload failed'))
            return
          }

          resolve(
            NextResponse.json({
              success: true,
              data: {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
              },
            })
          )
        }
      ).end(buffer)
    })

    return response
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { publicId } = body

    if (!publicId || typeof publicId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Public ID is required' },
        { status: 400 }
      )
    }

    if (!canDeleteUploadedAsset(publicId, session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'You are not allowed to delete this asset' },
        { status: 403 }
      )
    }

    // Delete from Cloudinary
    const result = await new Promise<{ result: string }>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result)
      })
    })

    if (result.result !== 'ok') {
      return NextResponse.json(
        { success: false, message: 'Failed to delete image from Cloudinary' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete image error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete image' },
      { status: 500 }
    )
  }
}
