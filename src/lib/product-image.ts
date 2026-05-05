type ProductImageLike = {
  url?: string
}

type ProductLike = {
  image?: string | ProductImageLike
  images?: ProductImageLike[]
}

export function getPrimaryProductImage(product: ProductLike | null | undefined) {
  if (!product || typeof product !== 'object') {
    return undefined
  }

  if (typeof product.image === 'string' && product.image.length > 0) {
    return product.image
  }

  if (
    product.image &&
    typeof product.image === 'object' &&
    typeof product.image.url === 'string' &&
    product.image.url.length > 0
  ) {
    return product.image.url
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0]
    if (
      firstImage &&
      typeof firstImage === 'object' &&
      typeof firstImage.url === 'string' &&
      firstImage.url.length > 0
    ) {
      return firstImage.url
    }
  }

  return undefined
}
