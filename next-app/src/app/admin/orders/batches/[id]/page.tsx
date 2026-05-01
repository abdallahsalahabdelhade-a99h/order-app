import { getBatchMasterList } from '@/app/actions/batch'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'إدارة الطلبات - القائمة المجمعة',
}

export default async function BatchMasterListPage({ params }: { params: { id: string } }) {
  const result = await getBatchMasterList(params.id)

  if (!result.success || !result.data) {
    notFound()
  }

  const { data } = result

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" dir="rtl">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/admin/orders" className="text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors flex items-center gap-2 mb-4">
          <span>←</span> رجوع لطلبات اليوم
        </Link>
        
        <div className="bg-gray-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="text-orange-400 font-bold text-sm mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                قائمة مشتريات مجمعة
              </div>
              <h1 className="text-3xl font-extrabold mb-2">🏪 {data.restaurantName}</h1>
              <div className="text-gray-400 text-sm">
                تاريخ التجميع: {new Date(data.createdAt).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
            </div>
            
            <div className="text-left bg-black/30 rounded-2xl p-4 border border-gray-700 w-full md:w-auto">
              <div className="text-sm text-gray-400 mb-1">إجمالي التكلفة</div>
              <div className="text-2xl font-extrabold text-orange-400">{data.totalPrice} جنيه</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* The Master List (Shopping List) */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2 border-b-2 border-gray-100 pb-4">
              <span>📝</span> القائمة المجمعة للطلب
            </h2>
            
            <div className="space-y-3">
              {data.aggregatedItems.map((item, index) => (
                <div key={item.id} className="flex justify-between items-center p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <span className="font-extrabold text-gray-900 text-lg">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-gray-500 text-sm hidden sm:block">{item.priceAtTime} ج × {item.quantity}</div>
                    <div className="font-extrabold text-xl text-orange-600 bg-white px-4 py-1 rounded-lg shadow-sm border border-orange-200">
                      {item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Breakdown Section */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200 sticky top-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span>👥</span> تفاصيل الأشخاص
            </h2>
            <div className="text-sm text-gray-500 mb-4">لمعرفة لمن يذهب كل طلب ومتابعة الحسابات.</div>
            
            <div className="space-y-4">
              {data.userBreakdown.map((userOrder) => (
                <div key={userOrder.orderId} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <span className="font-bold text-gray-900">{userOrder.userName}</span>
                    <span className="font-extrabold text-orange-600 text-sm">{userOrder.totalPrice} ج</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-2">
                    {userOrder.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-bold text-gray-400">×{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  {userOrder.notes && (
                    <div className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded border border-yellow-100">
                      📝 {userOrder.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
