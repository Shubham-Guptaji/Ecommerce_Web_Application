import assert from 'node:assert/strict'
import { getPrimaryProductImage } from '@/lib/product-image'

const arrayImage = getPrimaryProductImage({
  images: [
    { url: 'https://cdn.example.com/primary.jpg' },
    { url: 'https://cdn.example.com/secondary.jpg' },
  ],
})
assert.equal(arrayImage, 'https://cdn.example.com/primary.jpg')

const legacyImage = getPrimaryProductImage({
  image: 'https://cdn.example.com/legacy.jpg',
})
assert.equal(legacyImage, 'https://cdn.example.com/legacy.jpg')

const missingImage = getPrimaryProductImage({})
assert.equal(missingImage, undefined)
