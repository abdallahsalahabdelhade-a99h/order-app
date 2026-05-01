import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RestaurantMenu from '@/components/RestaurantMenu'

export default async function RestaurantDetailsPage({ params }: { params: { id: string } }) {
  // Fetch Restaurant with its Categories and Items
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.id },
    include: {
      categories: {
        include: {
          items: true
        }
      }
    }
  })

  if (!restaurant) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" dir="rtl">
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link href="/" className="text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-2 mb-4">
          <span>←</span> رجوع للمطاعم
        </Link>
        
        <div className="bg-gradient-to-l from-orange-600 to-orange-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">🏪 {restaurant.name}</h1>
              {restaurant.deliveryNumber && (
                <a 
                  href={`tel:${restaurant.deliveryNumber}`}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
                >
                  📞 اطلب دليفري: {restaurant.deliveryNumber}
                </a>
              )}
            </div>
            
            {restaurant.menuImageUrl && (
              <a 
                href={restaurant.menuImageUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm border border-white/30 shadow-sm"
              >
                📄 عرض المنيو المصور
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Menu Categories and Items (Client Component) */}
      <RestaurantMenu categories={restaurant.categories} />
      
      {/* Padding at bottom to avoid overlapping with floating cart */}
      <div className="h-24"></div>
    </div>
  )
}
