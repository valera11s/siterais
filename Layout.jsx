import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './src/utils.js';
import { apiClient } from './src/api/apiClient.js';
import { useQuery } from '@tanstack/react-query';
import { Button } from "./Components/ui/button.jsx";
import { 
  ShoppingBag, Menu, X,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from './Components/shop/CartDrawer';
import ChatWidget from './Components/chat/ChatWidget';
import CategoryMenuBar from './Components/shop/CategoryMenuBar';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Инициализация гостевой сессии
    let sid = localStorage.getItem('guest_session');
    if (!sid) {
      sid = 'guest_' + Date.now();
      localStorage.setItem('guest_session', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Убрали prefetchQuery - CategoryMenuBar уже использует useQuery с тем же ключом,
  // и React Query автоматически кэширует данные. Это предотвращает бесконечные циклы.

  const { data: cartItems = [], isLoading: isLoadingCart } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => apiClient.entities.CartItem.filter({ session_id: sessionId }),
    enabled: !!sessionId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.entities.Product.list(),
  });

  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/settings`);
      if (!response.ok) throw new Error('Ошибка загрузки настроек');
      return response.json();
    },
  });

  // Загружаем категории для футера
  const { data: footerCategories = [] } = useQuery({
    queryKey: ['footer-categories'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories?parent_id=null`);
      if (!response.ok) return [];
      const data = await response.json();
      // Порядок категорий для отображения в футере
      const categoryOrder = ['Фотоаппараты', 'Объективы', 'Видеокамеры', 'Вспышки'];
      return data.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.name);
        const indexB = categoryOrder.indexOf(b.name);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      }).slice(0, 4); // Берем первые 4
    },
  });

  const updateQuantityMutation = async (id, quantity) => {
    await apiClient.entities.CartItem.update(id, { quantity });
  };

  const removeItemMutation = async (id) => {
    await apiClient.entities.CartItem.delete(id);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { name: 'Главная', page: 'Home' },
    { name: 'Каталог', page: 'Shop' },
    { name: 'Доставка и Оплата', page: 'Delivery' },
    { name: 'Гарантия', page: 'Warranty' },
    { name: 'О нас', page: 'About' },
    { name: 'Контакты', page: 'Contacts' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Навигация */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-slate-100 border-slate-200 shadow-md' 
          : 'bg-white/80 backdrop-blur-lg border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76.8px] min-h-[76.8px] py-2">
            {/* Логотип */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="BestTechno" 
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </Link>

            {/* Десктопное меню */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname.includes(link.page) 
                      ? 'text-slate-900' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Правые кнопки */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Кнопка звонка */}
              {settings.phone && (
                <>
                  <a href={`tel:+${settings.phone_formatted || settings.phone.replace(/\D/g, '')}`} className="hidden sm:flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">{settings.phone}</span>
                  </a>
                  
                  <a href={`tel:+${settings.phone_formatted || settings.phone.replace(/\D/g, '')}`} className="sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-emerald-100 hover:bg-emerald-200"
                >
                  <Phone className="h-4 w-4 text-emerald-600" />
                </Button>
              </a>
                </>
              )}

              {/* Корзина */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="rounded-full"
              >
                <ShoppingBag className="h-5 w-5 text-slate-700" />
              </Button>

              {/* Мобильное меню */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden rounded-full"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Мобильное меню */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-slate-600 hover:text-slate-900"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Горизонтальное меню категорий */}
      <CategoryMenuBar />

      {/* Основной контент */}
      <main>{children}</main>

      {/* Виджет чата */}
      <ChatWidget />

      {/* Футер */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Информация</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to={createPageUrl('Warranty')} className="hover:text-white transition-colors">
                    Гарантия
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Каталог</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {footerCategories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      to={createPageUrl('Shop') + `?category=${category.id}`}
                      className="hover:text-white transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Поддержка</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to={createPageUrl('Contacts')} className="hover:text-white transition-colors">
                    Контакты
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('About')} className="hover:text-white transition-colors">
                    О нас
                  </Link>
                </li>
                <li>
                  <Link to={createPageUrl('Delivery')} className="hover:text-white transition-colors">
                    Доставка и Оплата
                  </Link>
                </li>
                <li>
                  <a 
                    href={`tel:+${settings.phone_formatted || settings.phone?.replace(/\D/g, '') || ''}`}
                    className="hover:text-white transition-colors"
                  >
                    Связаться с нами
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8" style={{ marginBottom: '10px' }}></div>
          
          <div className="space-y-2">
            <div className="text-center text-sm text-slate-500">
              © {new Date().getFullYear()} {settings.company_name || 'BestTechno'}. Все права защищены.
            </div>
            {settings.company_inn && (
              <div className="text-center text-xs text-slate-500">
                ИНН: {settings.company_inn}
              </div>
            )}
          </div>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        products={products}
        onUpdateQuantity={updateQuantityMutation}
        onRemoveItem={removeItemMutation}
        isLoading={isLoadingCart}
      />
    </div>
  );
}

