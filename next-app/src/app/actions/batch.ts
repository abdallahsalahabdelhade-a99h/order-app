'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Creates a new OrderBatch and links the specified orders to it.
 */
export async function createOrderBatch(orderIds: string[], restaurantId: string) {
  try {
    if (!orderIds.length) {
      return { success: false, error: 'No orders selected.' }
    }

    // 1. Fetch the selected orders to calculate total price
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        restaurantId: restaurantId,
        batchId: null // Ensure we only batch unbatched orders
      }
    })

    if (orders.length !== orderIds.length) {
      return { success: false, error: 'Some orders are already batched or do not belong to this restaurant.' }
    }

    const batchTotalPrice = orders.reduce((sum, order) => sum + order.totalPrice, 0)

    // 2. Create the OrderBatch
    const newBatch = await prisma.orderBatch.create({
      data: {
        restaurantId,
        totalPrice: batchTotalPrice,
        status: 'PENDING'
      }
    })

    // 3. Update the orders to link them to the new batch
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        batchId: newBatch.id,
        status: 'BATCHED' // Update order status
      }
    })

    // Revalidate paths to update UI
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/batches/${newBatch.id}`)

    return { success: true, batchId: newBatch.id }
  } catch (error: any) {
    console.error('Error creating order batch:', error)
    return { success: false, error: error.message || 'Failed to create batch.' }
  }
}

/**
 * Fetches the master list for a given batch.
 * Returns aggregated items (The Shopping List) and a user breakdown.
 */
export async function getBatchMasterList(batchId: string) {
  try {
    const batch = await prisma.orderBatch.findUnique({
      where: { id: batchId },
      include: {
        orders: {
          include: {
            user: true,
            items: {
              include: {
                menuItem: true
              }
            }
          }
        },
        restaurant: true
      }
    })

    if (!batch) {
      return { success: false, error: 'Batch not found.' }
    }

    // Aggregate identical items across all orders
    // Key: menuItemId, Value: aggregated data
    const itemMap = new Map<string, {
      id: string
      name: string
      quantity: number
      priceAtTime: number
      totalValue: number
    }>()

    batch.orders.forEach(order => {
      order.items.forEach(orderItem => {
        const key = orderItem.menuItemId
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!
          existing.quantity += orderItem.quantity
          existing.totalValue += (orderItem.quantity * orderItem.priceAtTime)
        } else {
          itemMap.set(key, {
            id: orderItem.menuItemId,
            name: orderItem.menuItem.name,
            quantity: orderItem.quantity,
            priceAtTime: orderItem.priceAtTime,
            totalValue: (orderItem.quantity * orderItem.priceAtTime)
          })
        }
      })
    })

    const aggregatedItems = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity)

    // User breakdown
    const userBreakdown = batch.orders.map(order => ({
      orderId: order.id,
      userName: order.user.name,
      totalPrice: order.totalPrice,
      notes: order.notes,
      items: order.items.map(i => ({
        name: i.menuItem.name,
        quantity: i.quantity
      }))
    }))

    return {
      success: true,
      data: {
        batchId: batch.id,
        createdAt: batch.createdAt,
        status: batch.status,
        totalPrice: batch.totalPrice,
        restaurantName: batch.restaurant.name,
        aggregatedItems,
        userBreakdown
      }
    }
  } catch (error: any) {
    console.error('Error fetching batch master list:', error)
    return { success: false, error: error.message || 'Failed to fetch master list.' }
  }
}
