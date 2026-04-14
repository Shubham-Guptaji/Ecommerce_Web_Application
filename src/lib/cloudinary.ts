// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export interface UploadOptions {
  folder?: string
  allowed_formats?: string[]
  max_size?: number
  transformation?: any
}

export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<{
  url: string
  public_id: string
  secure_url: string
}> {
  try {
    const folder = options.folder || process.env.CLOUDINARY_UPLOAD_FOLDER || 'ecommerce'
    const allowedFormats = options.allowed_formats || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
    const maxSize = options.max_size || 5 * 1024 * 1024 // 5MB default

    // Convert Buffer to base64 if needed
    let fileBuffer: Buffer
    if (typeof file === 'string') {
      // Assuming it's a base64 string or URL
      if (file.startsWith('data:')) {
        const base64Data = file.split(',')[1]
        fileBuffer = Buffer.from(base64Data, 'base64')
      } else {
        // It's a URL, return as is
        return {
          url: file,
          public_id: '',
          secure_url: file,
        }
      }
    } else {
      fileBuffer = file
    }

    // Validate file size
    if (fileBuffer.length > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
    }

    const uploadResult = await new Promise<{
      url: string
      public_id: string
      secure_url: string
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          allowed_formats: allowedFormats,
          resource_type: 'image',
          ...options.transformation,
        },
        (error, result) => {
          if (error) {
            reject(error)
            return
          }
          if (!result) {
            reject(new Error('Upload failed: no result returned'))
            return
          }
          resolve({
            url: result.url,
            public_id: result.public_id,
            secure_url: result.secure_url,
          })
        }
      ).end(fileBuffer)
    })

    return uploadResult
  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error)
          return
        }
        resolve(result)
      })
    })
    return true
  } catch (error: any) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

export function getOptimizedUrl(publicId: string, options: any = {}): string {
  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto:good',
    width: options.width || 800,
    height: options.height || 600,
    crop: options.crop || 'scale',
  }

  return cloudinary.url(publicId, defaultOptions)
}
