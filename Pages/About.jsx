import React from 'react';
import { Users, Award, Heart, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '10+', label: 'Лет на рынке' },
  { value: '50 000+', label: 'Довольных клиентов' },
  { value: '500+', label: 'Товаров в каталоге' },
  { value: '4.9', label: 'Средний рейтинг' },
];

const values = [
  {
    icon: ShieldCheck,
    title: 'Гарантия качества',
    description: 'Мы продаём только оригинальную технику с официальной гарантией производителя'
  },
  {
    icon: Users,
    title: 'Экспертная поддержка',
    description: 'Наши консультанты — профессиональные фотографы, которые помогут с выбором'
  },
  {
    icon: Truck,
    title: 'Быстрая доставка',
    description: 'Доставляем по всей России. Бесплатная доставка при заказе от 50 000 ₽'
  },
  {
    icon: Heart,
    title: 'Забота о клиентах',
    description: 'Индивидуальный подход к каждому покупателю и постпродажное обслуживание'
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Заголовок */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/logo2.png" 
                alt="BestTechno" 
                className="h-12 w-auto object-contain"
              />
              <span className="text-2xl font-bold">BestTechno</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Ваш надёжный партнёр в мире фотографии
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Продаем камеры, фотоаппараты, экшен-камеры и различную периферию для начинающих, любителей и профессиональных фотографов. У нас вы найдете все необходимое по лучшей цене.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Статистика */}
      <div className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* История */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Наша история</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                BestTechno был основан в 2014 году группой энтузиастов-фотографов, 
                которые хотели создать место, где каждый сможет найти идеальную камеру 
                для своих творческих задач.
              </p>
              <p>
                За годы работы мы стали одним из ведущих магазинов фототехники в России. 
                Наша команда постоянно следит за новинками рынка и тестирует оборудование, 
                чтобы предлагать клиентам только лучшее.
              </p>
              <p>
                Сегодня BestTechno — это не просто магазин, а сообщество людей, 
                объединённых любовью к фотографии и видеосъёмке.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="/about-team.jfif"
              alt="Наша команда"
              className="rounded-2xl shadow-xl w-full"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Ценности */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Наши ценности</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Принципы, которыми мы руководствуемся в работе каждый день
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-500">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}