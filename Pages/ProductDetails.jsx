import React, { useState, useEffect } from 'react';
import { apiClient } from '../src/api/apiClient.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createPageUrl, formatPrice, createProductUrl } from '../src/utils.js';
import { saveShopScrollPosition } from '../src/components/ScrollToTop.jsx';
import { Button } from "../Components/ui/button.jsx";
import { Badge } from "../Components/ui/badge.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Components/ui/tabs.jsx";
import { 
  ArrowLeft, ArrowRight, Star, ShoppingBag, Check, 
  Truck, Shield, RotateCcw, Minus, Plus, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Skeleton } from "../Components/ui/skeleton.jsx";
import CartDrawer from '../Components/shop/CartDrawer';

export default function ProductDetails() {
  const { slug } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || (slug ? slug.split('-').pop() : null);
  const identifier = slug || productId;
  const navigate = useNavigate();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const queryClient = useQueryClient();

  // Функция для возврата к каталогу с сохранением состояния
  const handleBackToCatalog = () => {
    // Сохраняем текущую позицию скролла (если переходили с каталога)
    // Позиция скролла уже сохранена при переходе на товар (через saveShopScrollPosition)
    // Фильтры нужно сохранить из URL параметров, если они есть, или оставить текущие
    navigate(createPageUrl('Shop'));
  };

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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', identifier],
    queryFn: async () => {
      if (!identifier) return null;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      try {
        const response = await fetch(`${apiUrl}/api/products/${encodeURIComponent(identifier)}`);
        if (response.ok) {
          const data = await response.json();
          // Парсим specs если это строка
          if (data.specs && typeof data.specs === 'string') {
            try {
              data.specs = JSON.parse(data.specs);
            } catch (e) {
              data.specs = {};
            }
          }
          return data;
        } else {
          console.error('Ошибка загрузки товара:', response.status, response.statusText);
          return null;
        }
      } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        return null;
      }
    },
    enabled: !!identifier,
  });

  useEffect(() => {
    if (product) {
      document.title = `${product.name} - BestTechno`;
      
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', product.description || `${product.name} - купить в BestTechno. Цена: ${product.price} ₽`);

      const setMetaProperty = (property, content) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      setMetaProperty('og:image', product.image_url || '/logo.png');
      setMetaProperty('og:title', product.name);
      setMetaProperty('og:description', product.description || `${product.name} - купить в BestTechno`);
      setMetaProperty('og:type', 'product');
      setMetaProperty('og:url', window.location.href);
    }
  }, [product]);

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
    mutationFn: async () => {
      const existing = cartItems.find(item => item.product_id === product.id);
      if (existing) {
        return apiClient.entities.CartItem.update(existing.id, { quantity: existing.quantity + quantity });
      }
      return apiClient.entities.CartItem.create({
        product_id: product.id,
        quantity,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Товар не найден</h2>
          <Link to={createPageUrl('Shop')}>
            <Button className="rounded-full">Вернуться в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.original_price 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  // Объединяем изображения и убираем дубликаты
  const imagesArray = product.images || [];
  const allImagesRaw = [product.image_url, ...imagesArray].filter(Boolean);
  // Убираем дубликаты, сохраняя порядок
  const allImages = [...new Set(allImagesRaw)];
  
  if (allImages.length === 0) {
    allImages.push('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+');
  }

  const relatedProducts = products
    .filter(p => p.brand === product.brand && p.id !== product.id)
    .slice(0, 4);

  const specLabels = {
    sensor: 'Сенсор',
    megapixels: 'Мегапиксели',
    iso_range: 'Диапазон ISO',
    video: 'Видео',
    weight: 'Вес'
  };

  // Отображаемое название с префиксом, если он задан для категории
  const displayName = product.category_product_name_prefix 
    ? `${product.category_product_name_prefix} ${product.name}`
    : product.name;

  return (
    <div className="min-h-screen bg-white">
      {/* Хлебные крошки */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to={createPageUrl('Home')} className="hover:text-slate-900">Главная</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={createPageUrl('Shop')} className="hover:text-slate-900">Каталог</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900">{displayName}</span>
            </div>
            
            {/* Кнопка "Вернуться к каталогу" */}
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full"
              onClick={handleBackToCatalog}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              К каталогу
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Галерея изображений */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 overflow-hidden">
              {discount > 0 && (
                <Badge className="absolute top-6 left-6 bg-rose-500 text-white font-medium px-4 py-1.5 rounded-full text-sm">
                  -{discount}%
                </Badge>
              )}
              <img
                src={allImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';
                }}
              />
            </div>
            
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-slate-900' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Информация о товаре */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  {product.brand}
                </span>
                {product.condition && (
                  <Badge 
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      product.condition === 'new' || product.condition === 'Новое' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {product.condition === 'new' || product.condition === 'Новое' ? 'Новый' : 
                     product.condition === 'used' || product.condition === 'Б/У' ? 'Б/У' : 
                     product.condition}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
                {displayName}
              </h1>
              <p className="text-sm text-slate-500 mt-2">Артикул: {product.id}</p>
            </div>

            {product.rating && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                  />
                ))}
              </div>
            )}

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">
                {formatPrice(product.price)} ₽
              </span>
              {product.original_price && (
                <span className="text-xl text-slate-400 line-through">
                  {formatPrice(product.original_price)} ₽
                </span>
              )}
            </div>

            <p className="text-slate-600 leading-relaxed">
              {product.description || 'Профессиональная камера с исключительным качеством изображения и расширенными функциями для фото- и видеосъёмки.'}
            </p>

            {/* Преимущества */}
            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Бесплатная доставка</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Гарантия 1 год</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Возврат 30 дней</p>
              </div>
            </div>

            {/* Количество и добавление в корзину */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-100 rounded-full px-2 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 rounded-full"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={!product.in_stock || addToCartMutation.isPending}
                className="w-full h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {product.in_stock ? 'В корзину' : 'Нет в наличии'}
              </Button>
            </div>

            {product.in_stock && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Check className="w-4 h-4" />
                В наличии — готов к отправке
              </div>
            )}
          </motion.div>
        </div>

        {/* Вкладки с характеристиками */}
        <div className="mt-16">
          <Tabs defaultValue="specs" className="w-full">
            <TabsList className="bg-slate-100 rounded-full p-1 w-full sm:w-auto">
              <TabsTrigger value="specs" className="rounded-full">Характеристики</TabsTrigger>
              <TabsTrigger value="features" className="rounded-full">Особенности</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-full">Отзывы</TabsTrigger>
            </TabsList>
            
            <TabsContent value="specs" className="mt-8">
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0 ? (
                    Object.entries(product.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-3 border-b border-slate-200 last:border-0">
                        <span className="text-slate-500">{specLabels[key] || key}</span>
                        <span className="font-medium text-slate-900">{String(value)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 col-span-2">Характеристики не указаны</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="mt-8">
              <div className="bg-slate-50 rounded-2xl p-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span>Продвинутая система автофокуса</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span>Высокое разрешение сенсора</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span>Запись видео 4K</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <span>Пыле- и влагозащищённый корпус</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-8">
              <div className="bg-slate-50 rounded-2xl p-6 text-center">
                <p className="text-slate-500">Отзывов пока нет</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Похожие товары */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Ещё от {product.brand}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={createProductUrl(p)}>
                  <div className="bg-slate-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <img 
                      src={p.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L3RleHQ+PC9zdmc+'} 
                      alt={p.name}
                      className="w-full aspect-square object-contain mb-4"
                    />
                    <p className="text-xs text-slate-400 uppercase">{p.brand}</p>
                    <p className="font-medium text-slate-900 line-clamp-1">{p.name}</p>
                    <p className="font-bold text-slate-900 mt-1">{formatPrice(p.price)} ₽</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

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