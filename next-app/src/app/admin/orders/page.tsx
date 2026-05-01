import { prisma } from '@/lib/prisma'
import OrderSelectionList from '@/components/admin/OrderSelectionList'

export const metadata = {
  title: 'إدارة الطلبات - طلبات اليوم',
}

export default async function AdminOrdersPage() {
  // Fetch unbatched orders for today (mocking the "today" aspect for simplicity)
  // In a real app, you would filter by createdAt >= startOfToday
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      batchId: null
    },
    include: {
      user: true,
      restaurant: true,
      items: {
        include: {
          menuItem: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Group orders by restaurant to make selection easier
  // since a batch belongs to ONE restaurant.
  const ordersByRestaurant = pendingOrders.reduce((acc, order) => {
    if (!acc[order.restaurantId]) {
      acc[order.restaurantId] = {
        restaurantName: order.restaurant.name,
        orders: []
      }
    }
    acc[order.restaurantId].orders.push(order)
    return acc
  }, {} as Record<string, { restaurantName: string, orders: any[] }>)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">📋 طلبات اليوم (غير مجمعة)</h1>
        <p className="text-gray-500 mt-2">حدد الطلبات التي تريد تجميعها في قائمة مشتريات واحدة لكل مطعم.</p>
      </div>

      {Object.keys(ordersByRestaurant).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100">
          <div className="text-5xl mb-4">🙌</div>
          <h3 className="text-xl font-bold text-gray-700">لا توجد طلبات معلقة حالياً</h3>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(ordersByRestaurant).map(([restaurantId, data]) => (
            <div key={restaurantId} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-orange-600 mb-6 flex items-center gap-2">
                <span>🏪</span> {data.restaurantName}
              </h2>
              
              <OrderSelectionList 
                restaurantId={restaurantId} 
                orders={data.orders} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
