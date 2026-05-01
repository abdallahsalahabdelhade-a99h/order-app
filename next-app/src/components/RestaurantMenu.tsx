'use client'

import { useState } from 'react'
import { MenuItem, MenuCategory } from '@prisma/client'

type CategoryWithItems = MenuCategory & {
  items: MenuItem[]
}

export default function RestaurantMenu({ categories }: { categories: CategoryWithItems[] }) {
  const [cart, setCart] = useState<Record<string, number>>({})

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || 0
      const next = Math.max(0, current + delta)
      const newCart = { ...prev }
      if (next === 0) {
        delete newCart[itemId]
      } else {
        newCart[itemId] = next
      }
      return newCart
    })
  }

  // Calculate Subtotal
  let subtotal = 0
  categories.forEach(cat => {
    cat.items.forEach(item => {
      const qty = cart[item.id] || 0
      subtotal += qty * item.price
    })
  })

  return (
    <div>
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-bold">هذا المطعم لا يحتوي على أصناف بعد</h3>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(category => (
            <div key={category.id} className="mb-6">
              <div className="text-lg font-extrabold text-gray-900 border-b-2 border-orange-200 pb-2 mb-4 flex justify-between items-center cursor-pointer">
                <span>{category.title}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.items.map(item => {
                  const qty = cart[item.id] || 0
                  const isSelected = qty > 0

                  return (
                    <div 
                      key={item.id} 
                      className={`relative bg-white border-2 rounded-2xl p-4 text-center transition-all duration-200 ${isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-orange-100 hover:border-orange-300'}`}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 -left-3 bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10">
                          {qty}
                        </div>
                      )}
                      
                      <div className="text-3xl mb-2">{item.imageUrl ? '🍔' : '🥙'}</div> {/* Fallback emoji for demo */}
                      <div className="font-bold text-sm mb-1">{item.name}</div>
                      <div className="text-orange-600 font-extrabold text-sm mb-3">{item.price} جنيه</div>
                      
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-orange-600 hover:bg-orange-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                        >
                          −
                        </button>
                        <span className="font-extrabold text-lg min-w-[20px]">{qty}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-orange-600 hover:bg-orange-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Summary Floating Bar (simplified) */}
      {subtotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex justify-between items-center">
              <div>
                <div className="text-sm text-gray-400">الإجمالي (بدون الخدمة)</div>
                <div className="text-2xl font-extrabold text-orange-400">{subtotal} جنيه</div>
              </div>
              <button className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                متابعة الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
