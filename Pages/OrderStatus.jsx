import React from 'react';
import { useQuery } from '@tanstack/react-query';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../src/utils.js';
import { Button } from "../Components/ui/button.jsx";
import { Badge } from "../Components/ui/badge.jsx";
import { Separator } from "../Components/ui/separator.jsx";
import { 
  Package, Truck, CheckCircle2, Clock, XCircle, 
  ArrowLeft, MapPin, Phone, Mail, ShoppingBag,
  CircleDot, Copy, Check, CreditCard, Wallet, Banknote
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from "../Components/ui/skeleton.jsx";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState } from 'react';

const statusConfig = {
  pending: { 
    label: 'Создан', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    step: 1
  },
  processing: { 
    label: 'В обработке', 
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle2,
    step: 2
  },
  assembling: { 
    label: 'Собирается', 
    color: 'bg-indigo-100 text-indigo-800',
    icon: Package,
    step: 3
  },
  shipped: { 
    label: 'Отправлен', 
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
    step: 4
  },
  delivered: { 
    label: 'Доставлен', 
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle2,
    step: 5
  },
  cancelled: { 
    label: 'Отменён', 
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    step: 0
  },
};

const steps = [
  { key: 'pending', label: 'Создан' },
  { key: 'processing', label: 'В обработке' },
  { key: 'assembling', label: 'Собирается' },
  { key: 'shipped', label: 'Отправлен' },
  { key: 'delivered', label: 'Доставлен' },
];

function OrderStatusHelp() {
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/settings`);
      if (!response.ok) throw new Error('Ошибка загрузки настроек');
      return response.json();
    },
  });

  if (!settings.phone) return null;

  return (
    <div className="mt-6 text-center">
      <p className="text-slate-500 text-sm">
        Есть вопросы по заказу? Позвоните нам: 
        <a href={`tel:+${settings.phone_formatted || settings.phone.replace(/\D/g, '')}`} className="text-slate-900 font-medium ml-1">
          {settings.phone}
        </a>
      </p>
    </div>
  );
}

export default function OrderStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('order');
  const [linkCopied, setLinkCopied] = useState(false);
  
  const orderLink = `${window.location.origin}${createPageUrl('OrderStatus')}?order=${orderNumber}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderLink);
    setLinkCopied(true);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setLinkCopied(false), 2000);
  };
  
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      try {
        const response = await fetch(`${apiUrl}/api/orders/${orderNumber}`);
        if (!response.ok) throw new Error('Заказ не найден');
        const data = await response.json();
        // Преобразуем JSON поля если они строки
        if (typeof data.items === 'string') data.items = JSON.parse(data.items);
        if (typeof data.shipping_address === 'string') data.shipping_address = JSON.parse(data.shipping_address);
        return data;
      } catch (err) {
        // Fallback на localStorage если API недоступен
        const ordersStr = localStorage.getItem('orders') || '[]';
        const orders = JSON.parse(ordersStr);
        return orders.find(o => o.order_number === orderNumber);
      }
    },
    enabled: !!orderNumber,
    refetchInterval: 30000, // Обновлять каждые 30 секунд
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="bg-white rounded-2xl p-8">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-20 w-full mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Заказ не найден</h2>
          <p className="text-slate-500 mb-6">Проверьте правильность номера заказа</p>
          <Link to={createPageUrl('Home')}>
            <Button className="rounded-full">На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link 
          to={createPageUrl('Home')} 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Номер заказа</p>
                <h1 className="text-2xl sm:text-3xl font-bold">#{order.order_number}</h1>
              </div>
              <Badge className={`${currentStatus.color} px-4 py-2 text-sm font-medium self-start`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {currentStatus.label}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              {order.created_date && (
                <p className="text-slate-400 text-sm">
                  Создан: {format(new Date(order.created_date), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white self-start sm:self-auto"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать ссылку на заказ
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Сообщение о звонке менеджера */}
          {order.status === 'pending' && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Вам позвонит менеджер</h3>
                  <p className="text-blue-700 text-sm">
                    Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа и уточнения деталей доставки.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          {!isCancelled && (
            <div className="p-6 sm:p-8 border-b">
              <div className="relative">
                <div className="flex justify-between items-start">
                  {steps.map((step, index) => {
                    const isCompleted = currentStatus.step > index + 1;
                    const isCurrent = currentStatus.step === index + 1;
                    
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center relative z-10 flex-1">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-emerald-500 text-white' :
                            isCurrent ? 'bg-slate-900 text-white' :
                            'bg-slate-200 text-slate-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <CircleDot className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </div>
                          <p className={`text-xs sm:text-sm mt-2 text-center ${
                            isCurrent ? 'font-semibold text-slate-900' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        {/* Линия между шагами */}
                        {index < steps.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 mt-4 sm:mt-5 relative">
                            <div className="absolute inset-0 bg-slate-200" />
                            <div 
                              className={`absolute inset-0 transition-all duration-500 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                              }`}
                              style={{ width: isCompleted ? '100%' : '0%' }}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="p-6 sm:p-8 border-b">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Состав заказа
            </h2>
            <div className="space-y-4">
              {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{item.product_name || item.name}</p>
                    <p className="text-sm text-slate-500">Кол-во: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-900">Итого</span>
              <span className="text-2xl font-bold text-slate-900">
                {order.total?.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {/* Payment Method */}
          {order.payment_method && (
            <div className="p-6 sm:p-8 border-b">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                {order.payment_method === 'card' && <CreditCard className="w-5 h-5" />}
                {order.payment_method === 'sbp' && <Wallet className="w-5 h-5" />}
                {order.payment_method === 'cash' && <Banknote className="w-5 h-5" />}
                {!['card', 'sbp', 'cash'].includes(order.payment_method) && <CreditCard className="w-5 h-5" />}
                Способ оплаты
              </h2>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-medium text-slate-900">
                  {order.payment_method === 'card' && 'Банковская карта (Visa, Mastercard, МИР)'}
                  {order.payment_method === 'sbp' && 'СБП (Система быстрых платежей)'}
                  {order.payment_method === 'cash' && 'Наличными при получении'}
                  {!['card', 'sbp', 'cash'].includes(order.payment_method) && 'Не указан'}
                </p>
              </div>
            </div>
          )}

          {/* Delivery Method and Address */}
          {order.shipping_address && (
            <div className="p-6 sm:p-8">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Способ доставки
              </h2>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div>
                  <p className="font-medium text-slate-900 mb-1">
                    {order.shipping_address.delivery_method === 'pickup' && 'Самовывоз из магазина'}
                    {order.shipping_address.delivery_method === 'courier' && 'Доставка курьером по Москве и МО'}
                    {order.shipping_address.delivery_method === 'pickup_point' && 'Доставка в пункт выдачи (СДЭК, Boxberry)'}
                    {!order.shipping_address.delivery_method && 'Не указан'}
                  </p>
                </div>
                
                {/* Адрес показываем только если не самовывоз */}
                {order.shipping_address.delivery_method && order.shipping_address.delivery_method !== 'pickup' && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Адрес доставки:</p>
                      <p className="text-slate-600">
                        {order.shipping_address.address}, {order.shipping_address.city}
                        {order.shipping_address.postal_code && `, ${order.shipping_address.postal_code}`}
                      </p>
                    </div>
                  </>
                )}
                
                {/* Для самовывоза показываем адрес магазина, если есть */}
                {order.shipping_address.delivery_method === 'pickup' && order.shipping_address.address && (
                  <>
                    <Separator className="my-2" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Адрес магазина:</p>
                      <p className="text-slate-600">{order.shipping_address.address}</p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Контактная информация */}
              <div className="mt-4 bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="font-medium text-slate-900">{order.shipping_address.full_name || order.customer_name}</p>
                {order.shipping_address.phone && (
                  <p className="text-slate-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.shipping_address.phone}
                  </p>
                )}
                {order.customer_email && (
                  <p className="text-slate-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {order.customer_email}
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Help Section */}
        <OrderStatusHelp />
      </div>
    </div>
  );
}