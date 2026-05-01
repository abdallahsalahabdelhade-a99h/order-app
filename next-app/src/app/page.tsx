import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata = {
  title: 'طلبات الإفطار - المطاعم',
}

export default async function HomePage() {
  // Fetch all restaurants
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" dir="rtl">
      <div className="bg-orange-600 rounded-2xl p-6 md:p-8 text-white mb-8 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold mb-2">أهلاً بك!</h2>
          <p className="text-orange-100">اختر المطعم الذي تريد الطلب منه 🍽️</p>
        </div>
        <div className="text-5xl">🏪</div>
      </div>

      <div className="mb-6 flex items-center gap-2 text-xl font-extrabold text-gray-900">
        <span>🏪</span>
        <h3>المطاعم المتاحة</h3>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-700">لا توجد مطاعم متاحة حالياً</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {restaurants.map(restaurant => (
            <Link 
              key={restaurant.id} 
              href={`/restaurant/${restaurant.id}`}
              className="bg-white border-2 border-orange-100 rounded-2xl p-6 hover:border-orange-500 hover:shadow-xl transition-all duration-300 group block relative overflow-hidden"
            >
              <div className="text-xl font-extrabold mb-2 text-gray-900 group-hover:text-orange-600 transition-colors">
                🏪 {restaurant.name}
              </div>
              {restaurant.deliveryNumber && (
                <div className="text-sm font-bold text-green-700 bg-green-50 inline-block px-3 py-1 rounded-lg mt-2">
                  📞 {restaurant.deliveryNumber}
                </div>
              )}
              {restaurant.logoUrl && (
                <div className="mt-4 rounded-xl overflow-hidden h-24 bg-gray-100 relative">
                  {/* Using standard img for simplicity in this demo */}
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
