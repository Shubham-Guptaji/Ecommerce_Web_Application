import type { ImageLoaderProps } from 'next/image'

const DEFAULT_CLOUD_NAME = 'dentjriek'
const CLOUDINARY_URL_REGEX = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/
const VERSION_SEGMENT_REGEX = /^v\d+$/

const buildTransformationString = (width: number, quality?: number) =>
  ['f_auto', `q_${quality ?? 'auto'}`, `w_${width}`, 'c_limit'].join(',')

const buildCloudinaryUrl = (
  cloudName: string,
  assetPath: string,
  width: number,
  quality?: number
) => {
  const segments = assetPath.split('/').filter(Boolean)
  const versionIndex = segments.findIndex((segment) => VERSION_SEGMENT_REGEX.test(segment))
  const publicIdPath =
    versionIndex >= 0 ? segments.slice(versionIndex).join('/') : segments.join('/')

  return `https://res.cloudinary.com/${cloudName}/image/upload/${buildTransformationString(width, quality)}/${publicIdPath}`
}

const cloudinaryLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const cloudinaryMatch = src.match(CLOUDINARY_URL_REGEX)

  if (cloudinaryMatch) {
    const [, cloudName, assetPath] = cloudinaryMatch
    return buildCloudinaryUrl(cloudName, assetPath, width, quality)
  }

  if (src.startsWith('http://') || src.startsWith('https://')) {
    const url = new URL(src)
    url.searchParams.set('w', String(width))

    if (quality) {
      url.searchParams.set('q', String(quality))
    }

    return url.toString()
  }

  return buildCloudinaryUrl(DEFAULT_CLOUD_NAME, src.replace(/^\/+/, ''), width, quality)
}

export default cloudinaryLoader
