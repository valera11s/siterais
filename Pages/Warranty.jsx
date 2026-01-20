import React from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Package, Headphones } from 'lucide-react';

export default function Warranty() {
  return (
    <div className="min-h-screen bg-white">
      {/* Заголовок секции */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-12 w-12 text-emerald-400" />
              <h1 className="text-4xl sm:text-5xl font-bold">
                Гарантия качества
              </h1>
            </div>
            <p className="text-xl text-slate-400 leading-relaxed">
              Мы с трепетом относимся ко всей продукции и предоставляем официальную гарантию на все товары
            </p>
          </motion.div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Гарантия 1 год */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl p-8 sm:p-12 mb-12"
        >
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Официальная гарантия 1 год
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                На всю продукцию мы предоставляем официальную гарантию производителя сроком на 1 год. 
                Это означает, что в течение этого периода мы полностью несем ответственность за качество 
                и работоспособность приобретенного товара.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Безотказная замена</p>
                    <p className="text-sm text-slate-600">При обнаружении производственного брака</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Бесплатное обслуживание</p>
                    <p className="text-sm text-slate-600">Ремонт и диагностика в сервисных центрах</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Оригинальные запчасти</p>
                    <p className="text-sm text-slate-600">Используем только оригинальные компоненты</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Быстрая обработка</p>
                    <p className="text-sm text-slate-600">Решение вопросов в кратчайшие сроки</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* О нашем отношении к продукции */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Наш подход к качеству</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <Package className="h-10 w-10 text-slate-700 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Тщательный отбор</h3>
              <p className="text-slate-600 leading-relaxed">
                Каждый товар проходит многоступенчатую проверку качества перед попаданием на склад. 
                Мы сотрудничаем только с проверенными поставщиками и официальными дистрибьюторами.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <Shield className="h-10 w-10 text-slate-700 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Надежная упаковка</h3>
              <p className="text-slate-600 leading-relaxed">
                Мы с особым вниманием относимся к упаковке товаров. Каждая единица упакована 
                с использованием качественных материалов, обеспечивающих сохранность при транспортировке.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <Headphones className="h-10 w-10 text-slate-700 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Постоянная поддержка</h3>
              <p className="text-slate-600 leading-relaxed">
                Наша служба поддержки работает круглосуточно и готова помочь вам на любом этапе 
                владения товаром - от выбора до технической поддержки.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Условия гарантии */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-50 rounded-3xl p-8 sm:p-12"
        >
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Условия гарантии</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-emerald-500 pl-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Срок действия</h3>
              <p className="text-slate-600">
                Гарантия действует в течение 1 года с момента покупки товара. Срок начинает отсчитываться 
                со дня передачи товара покупателю.
              </p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Что покрывает гарантия</h3>
              <p className="text-slate-600 mb-3">
                Гарантия покрывает любые производственные дефекты и неисправности, возникшие не по вине покупателя:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>Производственные дефекты и брак</li>
                <li>Неисправности компонентов в пределах гарантийного срока</li>
                <li>Несоответствие заявленным характеристикам</li>
              </ul>
            </div>
            <div className="border-l-4 border-emerald-500 pl-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Как воспользоваться гарантией</h3>
              <p className="text-slate-600 mb-3">
                При обнаружении неисправности свяжитесь с нами:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                <li>По телефону нашей службы поддержки</li>
                <li>Через форму обратной связи на сайте</li>
                <li>Лично в пункте выдачи товаров</li>
              </ul>
              <p className="text-slate-600 mt-3">
                При обращении необходимо предъявить гарантийный талон и товарный чек. 
                Наши специалисты проведут диагностику и в кратчайшие сроки решат вопрос.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}



