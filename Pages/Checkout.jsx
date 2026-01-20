import React, { useState, useEffect } from 'react';
import { apiClient } from '../src/api/apiClient.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../src/utils.js';
import { Button } from "../Components/ui/button.jsx";
import { Input } from "../Components/ui/input.jsx";
import { Label } from "../Components/ui/label.jsx";
import { Separator } from "../Components/ui/separator.jsx";
import { ArrowLeft, Truck, Loader2, MapPin, Package, Store, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../Components/ui/allert-dialog.jsx";

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}${random}`;
}

// Функция форматирования телефона
function formatPhone(value) {
  // Удаляем все нецифровые символы
  const numbers = value.replace(/\D/g, '');
  
  // Если начинается с 8, заменяем на 7
  let cleaned = numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers;
  
  // Если начинается с 7, оставляем, иначе добавляем 7
  if (!cleaned.startsWith('7') && cleaned.length > 0) {
    cleaned = '7' + cleaned;
  }
  
  // Ограничиваем до 11 цифр (7 + 10)
  cleaned = cleaned.slice(0, 11);
  
  // Форматируем: +7 (999) 123-45-67
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 1) return `+${cleaned}`;
  if (cleaned.length <= 4) return `+${cleaned[0]} (${cleaned.slice(1)}`;
  if (cleaned.length <= 7) return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
  if (cleaned.length <= 9) return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
}

// Валидация ФИО (только буквы, пробелы, дефисы)
function validateFullName(name) {
  return /^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(name);
}

// Валидация email
function validateEmail(email) {
  return email.includes('@') && email.length > 3;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    delivery_method: '', // 'pickup', 'courier', 'pickup_point'
  });

  const [errors, setErrors] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Загружаем настройки для получения адреса магазина
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/settings`);
      if (!response.ok) throw new Error('Ошибка загрузки настроек');
      return response.json();
    },
  });

  useEffect(() => {
    // Скроллим наверх при загрузке страницы
    window.scrollTo(0, 0);
    
    const initSession = async () => {
      const isAuth = await apiClient.auth.isAuthenticated();
      if (isAuth) {
        const user = await apiClient.auth.me();
        setSessionId(user.email);
        setFormData(prev => ({ ...prev, email: user.email, full_name: user.full_name || '' }));
      } else {
        let sid = localStorage.getItem('guest_session');
        if (!sid) {
          sid = 'guest_' + Date.now();
          localStorage.setItem('guest_session', sid);
        }
        setSessionId(sid);
      }
    };
    initSession();
  }, []);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => apiClient.entities.CartItem.filter({ session_id: sessionId }),
    enabled: !!sessionId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.entities.Product.list(),
  });

  const getProduct = (productId) => products.find(p => p.id === productId);

  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProduct(item.product_id);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  const shipping = subtotal > 50000 ? 0 : 990;
  const total = subtotal + shipping;

  // Проверка, нужен ли адрес для выбранного способа доставки
  const needsAddress = formData.delivery_method === 'courier' || formData.delivery_method === 'pickup_point';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Специальная обработка для телефона
    if (name === 'phone') {
      const formatted = formatPhone(value);
      setFormData({ ...formData, [name]: formatted });
      // Очищаем ошибку при вводе
      if (errors.phone) {
        setErrors({ ...errors, phone: '' });
      }
      return;
    }
    
    // Специальная обработка для ФИО
    if (name === 'full_name') {
      // Разрешаем только буквы, пробелы и дефисы
      if (value === '' || /^[а-яА-ЯёЁa-zA-Z\s-]*$/.test(value)) {
        setFormData({ ...formData, [name]: value });
        if (errors.full_name) {
          setErrors({ ...errors, full_name: '' });
        }
      }
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    
    // Очищаем ошибку при вводе
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Валидация ФИО
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'ФИО обязательно для заполнения';
    } else if (!validateFullName(formData.full_name)) {
      newErrors.full_name = 'ФИО должно содержать только буквы, пробелы и дефисы';
    }
    
    // Валидация email
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email должен содержать символ @';
    }
    
    // Валидация телефона
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (!phoneNumbers || phoneNumbers.length < 11) {
      newErrors.phone = 'Введите корректный номер телефона';
    }
    
    // Валидация способа доставки
    if (!formData.delivery_method) {
      newErrors.delivery_method = 'Выберите способ доставки';
    }
    
    // Валидация адреса (если нужен)
    if (needsAddress) {
      if (!formData.address.trim()) {
        newErrors.address = 'Адрес обязателен для заполнения';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'Город обязателен для заполнения';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    // Показываем диалог подтверждения
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    
    const orderNumber = generateOrderNumber();
    
    const orderItems = cartItems.map(item => {
      const product = getProduct(item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.name,
        quantity: item.quantity,
        price: product?.price,
      };
    });
    
    // Формируем адрес доставки в зависимости от способа
    let shippingAddress = {
      full_name: formData.full_name,
      phone: formData.phone,
    };
    
    if (formData.delivery_method === 'pickup') {
      // Самовывоз - используем адрес магазина
      shippingAddress.address = settings.address || 'Адрес магазина';
      shippingAddress.city = 'Москва';
      shippingAddress.postal_code = formData.postal_code || '';
      shippingAddress.delivery_method = 'pickup';
    } else {
      // Курьер или пункт выдачи - используем введенный адрес
      shippingAddress.address = formData.address;
      shippingAddress.city = formData.city || 'Москва'; // Автоматически подставляем Москва если не указан
      shippingAddress.postal_code = formData.postal_code || '';
      shippingAddress.delivery_method = formData.delivery_method;
    }
    
    let orderCreated = false;
    
    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          items: orderItems,
          total: total,
          customer_email: formData.email,
          customer_name: formData.full_name,
          shipping_address: shippingAddress,
          payment_method: null,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Ошибка создания заказа' }));
        const errorMessage = errorData.error || 'Ошибка создания заказа';
        console.error('Ошибка создания заказа:', errorMessage);
        toast.error(errorMessage);
        setIsSubmitting(false);
        return; // Не продолжаем, если заказ не создан
      }
      
      const order = await response.json();
      orderCreated = true;
      
      // Очистка корзины только если заказ успешно создан
      for (const item of cartItems) {
        await apiClient.entities.CartItem.delete(item.id);
      }

      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      setIsSubmitting(false);
      
      // Сразу редиректим на страницу заказа
      toast.success('Заказ успешно создан!');
      navigate(`${createPageUrl('OrderStatus')}?order=${orderNumber}`);
    } catch (error) {
      console.error('Ошибка создания заказа через API:', error);
      toast.error(error.message || 'Не удалось создать заказ. Попробуйте еще раз.');
      setIsSubmitting(false);
      // Не делаем fallback на localStorage и не редиректим
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ваша корзина пуста</h2>
          <Link to={createPageUrl('Shop')}>
            <Button className="rounded-full">Перейти в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl('Shop')} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Вернуться в каталог
        </Link>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Форма оформления */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Оформление заказа</h1>
              <p className="text-slate-500 mt-1">Заполните данные для доставки</p>
            </div>

            {/* Данные получателя */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm space-y-6"
            >
              <h2 className="text-xl font-semibold text-slate-900">Данные получателя</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">ФИО получателя *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Иванов Иван Иванович"
                    className={`mt-1.5 rounded-xl ${errors.full_name ? 'border-red-500' : ''}`}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@mail.ru"
                    className={`mt-1.5 rounded-xl ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+7 (999) 123-45-67"
                    className={`mt-1.5 rounded-xl ${errors.phone ? 'border-red-500' : ''}`}
                    maxLength={18}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Способ доставки */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm space-y-6"
            >
              <h2 className="text-xl font-semibold text-slate-900">Способ доставки *</h2>
              
              {errors.delivery_method && (
                <p className="text-sm text-red-500">{errors.delivery_method}</p>
              )}
              
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Самовывоз */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, delivery_method: 'pickup' });
                    if (errors.delivery_method) {
                      setErrors({ ...errors, delivery_method: '' });
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.delivery_method === 'pickup'
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Store className={`w-6 h-6 mb-2 ${formData.delivery_method === 'pickup' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-slate-900 mb-1">Самовывоз</h3>
                  <p className="text-sm text-slate-600">Из магазина</p>
                  {settings.address && (
                    <p className="text-xs text-slate-500 mt-2">{settings.address}</p>
                  )}
                </button>

                {/* Доставка курьером */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, delivery_method: 'courier', city: 'Москва' });
                    if (errors.delivery_method) {
                      setErrors({ ...errors, delivery_method: '' });
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.delivery_method === 'courier'
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Truck className={`w-6 h-6 mb-2 ${formData.delivery_method === 'courier' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-slate-900 mb-1">Курьером</h3>
                  <p className="text-sm text-slate-600 mb-2">По Москве и МО</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>1-2 рабочих дня</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>До двери</span>
                  </div>
                </button>

                {/* Пункт выдачи */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, delivery_method: 'pickup_point', city: 'Москва' });
                    if (errors.delivery_method) {
                      setErrors({ ...errors, delivery_method: '' });
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.delivery_method === 'pickup_point'
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Package className={`w-6 h-6 mb-2 ${formData.delivery_method === 'pickup_point' ? 'text-slate-900' : 'text-slate-400'}`} />
                  <h3 className="font-semibold text-slate-900 mb-1">Пункт выдачи</h3>
                  <p className="text-sm text-slate-600 mb-2">СДЭК, Boxberry</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>2-3 рабочих дня</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Выбор ПВЗ при оформлении</span>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Адрес доставки (показывается только если нужен) */}
            {needsAddress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm space-y-6"
              >
                <h2 className="text-xl font-semibold text-slate-900">Адрес доставки</h2>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Адрес *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="ул. Пушкина, д. 10, кв. 5"
                      className={`mt-1.5 rounded-xl ${errors.address ? 'border-red-500' : ''}`}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="city">Город *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Москва"
                      className={`mt-1.5 rounded-xl ${errors.city ? 'border-red-500' : ''}`}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Индекс</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      placeholder="123456"
                      className="mt-1.5 rounded-xl"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Оформление...
                </>
              ) : (
                `Оформить заказ на ${total.toLocaleString('ru-RU')} ₽`
              )}
            </Button>
          </div>

          {/* Итого заказа */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Ваш заказ</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => {
                  const product = getProduct(item.product_id);
                  if (!product) return null;
                  
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 p-2 flex-shrink-0">
                        <img
                          src={product.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWN0PC90ZXh0Pjwvc3ZnPg=='}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm line-clamp-1">{product.name}</p>
                        <p className="text-sm text-slate-500">Кол-во: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {(product.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Товары</span>
                  <span className="font-medium">{subtotal.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Доставка</span>
                  <span className="font-medium">{shipping === 0 ? 'Бесплатно' : `${shipping} ₽`}</span>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-900">Итого</span>
                <span className="text-2xl font-bold text-slate-900">{total.toLocaleString('ru-RU')} ₽</span>
              </div>

              {shipping === 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                  <Truck className="w-4 h-4" />
                  Бесплатная доставка от 50 000 ₽!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Диалог подтверждения */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение заказа</AlertDialogTitle>
            <div className="text-sm text-slate-600">
              <p>Вы уверены, что хотите оформить заказ? Пожалуйста, проверьте:</p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-left">
                <li>Контактные данные указаны верно</li>
                <li>Адрес доставки заполнен корректно</li>
                <li>Выбран правильный способ доставки</li>
              </ul>
              <p className="mt-4 text-sm font-medium text-slate-700">
                Обратите внимание: финальная стоимость доставки будет озвучена менеджером при подтверждении заказа.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Да, оформить заказ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
