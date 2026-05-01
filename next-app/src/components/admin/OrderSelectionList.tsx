'use client'

import { useState } from 'react'
import { createOrderBatch } from '@/app/actions/batch'
import { useRouter } from 'next/navigation'

export default function OrderSelectionList({ restaurantId, orders }: { restaurantId: string, orders: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const toggleSelection = (orderId: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(orderId)) {
      newSet.delete(orderId)
    } else {
      newSet.add(orderId)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)))
    }
  }

  const handleGroupOrders = async () => {
    if (selectedIds.size === 0) return
    
    setIsSubmitting(true)
    const result = await createOrderBatch(Array.from(selectedIds), restaurantId)
    setIsSubmitting(false)

    if (result.success) {
      setSelectedIds(new Set())
      router.push(`/admin/orders/batches/${result.batchId}`)
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4 px-2">
        <button 
          onClick={selectAll}
          className="text-sm font-bold text-orange-600 hover:text-orange-800"
        >
          {selectedIds.size === orders.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
        </button>
        <span className="text-sm text-gray-500">{orders.length} طلبات متاحة</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map(order => {
          const isSelected = selectedIds.has(order.id)
          
          return (
            <div 
              key={order.id} 
              onClick={() => toggleSelection(order.id)}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 hover:border-orange-300'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <h3 className="font-extrabold text-gray-900">{order.user.name}</h3>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              <div className="space-y-1 mb-3 text-sm text-gray-700 pr-9">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between border-b border-dashed border-gray-300 last:border-0 py-1">
                    <span>{item.menuItem.name}</span>
                    <span className="font-bold">×{item.quantity}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="text-xs bg-yellow-100 text-yellow-800 p-2 rounded-lg pr-9 mb-2">
                  📝 {order.notes}
                </div>
              )}

              <div className="text-left font-extrabold text-orange-600 mt-2">
                {order.totalPrice} جنيه
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          <div className="bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex justify-between items-center w-full max-w-2xl pointer-events-auto border border-gray-700">
            <div className="font-bold">
              تم تحديد <span className="text-orange-400 text-xl mx-1">{selectedIds.size}</span> طلبات
            </div>
            <button 
              onClick={handleGroupOrders}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              {isSubmitting ? 'جاري التجميع...' : 'تجميع الطلبات المحددة'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
