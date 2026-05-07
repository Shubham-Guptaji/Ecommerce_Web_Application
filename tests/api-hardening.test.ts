import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path: string) => readFileSync(join(root, path), 'utf8')

const codRoute = read('src/app/api/payment/cod/route.ts')
assert.match(codRoute, /requireCSRF/)
assert.match(codRoute, /checkoutSchema\.parse\(body\)/)

const uploadRoute = read('src/app/api/upload/route.ts')
assert.match(uploadRoute, /isAdminUploadFolder/)
assert.match(uploadRoute, /canDeleteUploadedAsset/)

const orderRoute = read('src/app/api/orders/[id]/route.ts')
assert.doesNotMatch(orderRoute, /export async function DELETE/)

const adminOrderStatusRoute = read('src/app/api/admin/orders/[id]/update-status/route.ts')
assert.match(adminOrderStatusRoute, /return updateAdminOrder/)
assert.match(adminOrderStatusRoute, /isValidOrderId/)

const trackOrderRoute = read('src/app/api/track-order/route.ts')
assert.match(trackOrderRoute, /trackOrderRateLimiter/)
assert.doesNotMatch(trackOrderRoute, /sendOrderStatusEmail/)
