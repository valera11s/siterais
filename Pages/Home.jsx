import React, { useState, useEffect } from 'react';
import { apiClient } from '../src/api/apiClient.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HeroSection from '../Components/shop/HeroSection';
import FeaturedProducts from '../Components/shop/FeaturedProducts';
import SaleProducts from '../Components/shop/SaleProducts';
import CategoriesGrid from '../Components/shop/CategoriesGrid';
import CartDrawer from '../Components/shop/CartDrawer';
import { toast } from 'sonner';
import { Camera, Truck, Shield, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Truck, title: 'Бесплатная доставка', desc: 'При заказе от 50 000 ₽' },
  { icon: Shield, title: 'Гарантия 1 год', desc: 'Официальная гарантия' },
  { icon: Headphones, title: 'Поддержка 24/7', desc: 'Всегда на связи' },
  { icon: Camera, title: 'Оригинальная техника', desc: 'Сертифицированные товары' },
];

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = 'Магазин фототехники BestTechno';
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Продаем камеры, фотоаппараты, экшен-камеры и различную периферию для начинающих, любителей и профессиональных фотографов. У нас вы найдете все необходимое по лучшей цене.');
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const isAuth = await apiClient.auth.isAuthenticated();
      if (isAuth) {
        const user = await apiClient.auth.me();
        setSessionId(user.email);
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

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.entities.Product.list(),
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => apiClient.entities.CartItem.filter({ session_id: sessionId }),
    enabled: !!sessionId,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product) => {
      const existing = cartItems.find(item => item.product_id === product.id);
      if (existing) {
        return apiClient.entities.CartItem.update(existing.id, { quantity: existing.quantity + 1 });
      }
      return apiClient.entities.CartItem.create({
        product_id: product.id,
        quantity: 1,
        session_id: sessionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
      toast.success('Добавлено в корзину!');
      setCartOpen(true);
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }) => apiClient.entities.CartItem.update(id, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', sessionId] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (id) => apiClient.entities.CartItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart', sessionId] }),
  });

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      
      <FeaturedProducts 
        products={products} 
        onAddToCart={(product) => addToCartMutation.mutate(product)} 
      />

      <SaleProducts 
        products={products} 
        onAddToCart={(product) => addToCartMutation.mutate(product)} 
      />

      <CategoriesGrid />
      
      {/* Преимущества */}
      <section className="py-16 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Подписка на рассылку */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4">Будьте в курсе</h2>
            <p className="text-slate-400 mb-8">
              Подпишитесь на рассылку и получайте эксклюзивные скидки, новинки и советы по фотографии
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Ваш email"
                className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button className="px-8 py-3 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors">
                Подписаться
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        products={products}
        onUpdateQuantity={(id, quantity) => updateQuantityMutation.mutate({ id, quantity })}
        onRemoveItem={(id) => removeItemMutation.mutate(id)}
      />
    </div>
  );
}