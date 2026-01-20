import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const deliveryMethods = [
  {
    icon: Truck,
    title: 'Курьерская доставка',
    description: 'Доставка до двери в удобное для вас время',
    price: '500 ₽',
    time: '1-3 дня',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Package,
    title: 'Пункты выдачи',
    description: 'Отправка CDEK по полной предоплате',
    price: 'от 190 ₽',
    time: '2-5 дней',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    icon: MapPin,
    title: 'Самовывоз',
    description: 'Заберите заказ из нашего магазина в Москве',
    price: 'Бесплатно',
    time: 'Сегодня',
    color: 'bg-purple-100 text-purple-600'
  }
];

const features = [
  'Быстрая доставка',
  'Отслеживание заказа в реальном времени',
  'Проверка товара при получении',
  'Доставка по всей России',
  'Страховка на весь период доставки'
];

export default function Delivery() {
  // Скролл наверх при открытии страницы
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/settings`);
      if (!response.ok) throw new Error('Ошибка загрузки настроек');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Заголовок */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-4">Доставка и оплата</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Выберите удобный способ доставки и оплаты вашего заказа
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Способы доставки */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Способы доставки</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {deliveryMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 rounded-2xl ${method.color} flex items-center justify-center mb-4`}>
                  <method.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{method.title}</h3>
                <p className="text-slate-500 mb-4">{method.description}</p>
                {/* Адрес магазина для самовывоза */}
                {method.title === 'Самовывоз' && settings.address && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Адрес магазина:</p>
                    <p className="text-slate-900 font-medium">{settings.address}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-sm text-slate-400">Стоимость</p>
                    <p className="font-semibold text-slate-900">{method.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Срок</p>
                    <p className="font-semibold text-slate-900">{method.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Преимущества */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-8 shadow-sm mb-16"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Наши преимущества</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-600">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Способы оплаты */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Способы оплаты</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Наличными</h3>
              <ul className="space-y-3 text-slate-600">
                <li>• Оплата наличными при получении заказа</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Безналичная оплата</h3>
              <ul className="space-y-3 text-slate-600">
                <li>• Безналичная оплата по расчетному счету (+10%)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}