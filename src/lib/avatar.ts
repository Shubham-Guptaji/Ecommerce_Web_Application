export type AvatarValue =
  | string
  | {
      url?: string | null
      publicId?: string | null
    }
  | null
  | undefined

export type AvatarObject = {
  url?: string
  publicId?: string
}

export function getAvatarUrl(avatar: AvatarValue): string | undefined {
  if (!avatar) return undefined

  if (typeof avatar === 'string') {
    const url = avatar.trim()
    return url || undefined
  }

  const url = avatar.url?.trim()
  return url || undefined
}

export function normalizeAvatar(avatar: AvatarValue): AvatarObject | undefined {
  if (!avatar) return undefined

  if (typeof avatar === 'string') {
    const url = avatar.trim()
    return url ? { url } : undefined
  }

  const url = avatar.url?.trim()
  const publicId = avatar.publicId?.trim()

  if (!url && !publicId) {
    return undefined
  }

  return {
    ...(url ? { url } : {}),
    ...(publicId ? { publicId } : {}),
  }
}
