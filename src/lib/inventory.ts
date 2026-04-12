import Product from '@/models/Product'

type InventoryItem = {
  product: string | { _id?: string; toString(): string }
  quantity: number
}

function getProductId(product: InventoryItem['product']) {
  if (typeof product === 'string') return product
  if (product && typeof product === 'object' && '_id' in product && product._id) {
    return product._id.toString()
  }
  return product.toString()
}

export async function decrementInventory(items: InventoryItem[]) {
  const applied: Array<{ product: string; quantity: number }> = []

  try {
    for (const item of items) {
      const productId = getProductId(item.product)
      const quantity = item.quantity

      const result = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity, soldCount: quantity } }
      )

      if (result.modifiedCount !== 1) {
        throw new Error(`Insufficient stock for product ${productId}`)
      }

      applied.push({ product: productId, quantity })
    }
  } catch (error) {
    if (applied.length > 0) {
      await incrementInventory(applied)
    }
    throw error
  }
}

export async function incrementInventory(items: InventoryItem[]) {
  for (const item of items) {
    const productId = getProductId(item.product)
    const quantity = item.quantity

    await Product.updateOne(
      { _id: productId },
      [
        {
          $set: {
            stock: { $add: ['$stock', quantity] },
            soldCount: {
              $max: [0, { $subtract: ['$soldCount', quantity] }],
            },
          },
        },
      ]
    )
  }
}
