import React, { useState, useEffect, useRef, startTransition } from 'react';
import { apiClient } from '../src/api/apiClient.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import ProductCard from '../Components/shop/ProductCard';
import CategoryFilter from '../Components/shop/CategoryFilter';
import CartDrawer from '../Components/shop/CartDrawer';
import { Input } from "../Components/ui/input.jsx";
import { Button } from "../Components/ui/button.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select.jsx";
import { Search, SlidersHorizontal, ShoppingBag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from "../Components/ui/skeleton.jsx";
// Удаляем импорт статических категорий - теперь загружаем из БД

export default function Shop() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState([]);
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState([]);
  // Убрали фильтр по состоянию - всегда только новые товары
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [cartOpen, setCartOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const filtersRestoredRef = useRef(false);
  const urlParamsProcessedRef = useRef(null); // Храним обработанный URL ключ
  const isProcessingUrlRef = useRef(false); // Флаг обработки URL
  const lastLocationRef = useRef(null); // Храним последний обработанный location
  const prevSavedFiltersRef = useRef(null); // Храним предыдущие сохраненные фильтры
  const productsPerPage = 21;

  // На мобильных устройствах фильтры должны быть частично открыты по умолчанию
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setShowFilters(true);
        setFiltersExpanded(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Восстанавливаем фильтры только при переходе с карточки товара
  useEffect(() => {
    // ВАЖНО: Используем только location.pathname в зависимостях, чтобы избежать циклов
    // location.search обрабатываем внутри через проверку ref
    if (!location.pathname.includes('/shop')) {
      // Если не на странице shop, сбрасываем refs
      lastLocationRef.current = null;
      urlParamsProcessedRef.current = null;
      isProcessingUrlRef.current = false;
      return;
    }

    const currentUrlKey = `${location.pathname}${location.search}`;
    
    // Если location не изменился - пропускаем
    if (lastLocationRef.current === currentUrlKey) {
      return;
    }
    
    // Если уже обрабатываем URL или уже обработали этот URL - пропускаем
    if (isProcessingUrlRef.current) {
      return;
    }
    
    if (urlParamsProcessedRef.current === currentUrlKey) {
      lastLocationRef.current = currentUrlKey;
      return;
    }
    
    // Помечаем, что начинаем обработку
    lastLocationRef.current = currentUrlKey;
    isProcessingUrlRef.current = true;
    
    // Проверяем, пришли ли мы с карточки товара
    const navigationFromShop = sessionStorage.getItem('navigation_from_shop');
      
      if (navigationFromShop === 'true') {
        // Пришли с карточки товара - восстанавливаем фильтры
        const savedFilters = sessionStorage.getItem('shop_filters');
        if (savedFilters) {
          try {
            const filters = JSON.parse(savedFilters);
            // Временно отключаем сохранение, чтобы избежать конфликта
            filtersRestoredRef.current = false;
            
            // Восстанавливаем фильтры (поддерживаем как старый формат 'all', так и новый массив)
            // Используем startTransition для всех обновлений состояний
            startTransition(() => {
              setSelectedCategory(Array.isArray(filters.category) ? filters.category : (filters.category === 'all' ? [] : (filters.category ? [filters.category] : [])));
              setSelectedSubcategory(Array.isArray(filters.subcategory) ? filters.subcategory : (filters.subcategory === 'all' ? [] : (filters.subcategory ? [filters.subcategory] : [])));
              setSelectedSubSubcategory(Array.isArray(filters.subSubcategory) ? filters.subSubcategory : (filters.subSubcategory === 'all' ? [] : (filters.subSubcategory ? [filters.subSubcategory] : [])));
              setSelectedBrand(Array.isArray(filters.brand) ? filters.brand : (filters.brand === 'all' ? [] : (filters.brand ? [filters.brand] : [])));
              setPriceMin(filters.priceMin || '');
              setPriceMax(filters.priceMax || '');
              setSelectedRating(filters.selectedRating !== undefined ? filters.selectedRating : null);
              setSearchQuery(filters.searchQuery || '');
            });
            
            // Разрешаем сохранение после небольшой задержки
            setTimeout(() => {
              filtersRestoredRef.current = true;
            }, 100);
          } catch (e) {
            console.error('Ошибка восстановления фильтров:', e);
            filtersRestoredRef.current = true;
          }
        } else {
          // Если нет сохраненных фильтров, сразу разрешаем сохранение
          filtersRestoredRef.current = true;
        }
        // Удаляем флаг после использования
        sessionStorage.removeItem('navigation_from_shop');
        // Завершаем обработку
        urlParamsProcessedRef.current = currentUrlKey;
        isProcessingUrlRef.current = false;
      } else {
        // Пришли не с карточки товара - проверяем параметры category и subcategory из URL
        const urlParams = new URLSearchParams(location.search);
        const categoryParam = urlParams.get('category');
        const subcategoryParam = urlParams.get('subcategory');
        
        if (categoryParam) {
          // Помечаем, что начинаем обработку
          isProcessingUrlRef.current = true;
          urlParamsProcessedRef.current = currentUrlKey;
          // Проверяем, является ли параметр ID (число) или названием (строка)
          const isNumeric = /^\d+$/.test(categoryParam);
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
          
          if (isNumeric) {
            // Если это ID - загружаем категорию по ID
            fetch(`${apiUrl}/api/categories/${categoryParam}`)
              .then(response => response.json())
              .then(category => {
                if (category && category.name) {
                  filtersRestoredRef.current = false;
                  // Используем startTransition для всех обновлений состояний
                  startTransition(() => {
                    setSelectedCategory([category.name]);
                    // Если есть подкатегория в URL, устанавливаем её
                    if (subcategoryParam) {
                      setSelectedSubcategory([subcategoryParam]);
                    } else {
                      setSelectedSubcategory([]);
                    }
                    setSelectedSubSubcategory([]);
                    setSelectedBrand([]);
                    setPriceMin('');
                    setPriceMax('');
                    setSelectedRating(null);
                    setSearchQuery('');
                  });
                  // НЕ используем window.history.replaceState, чтобы не вызывать циклы
                  // Просто помечаем URL как обработанный
                  urlParamsProcessedRef.current = `${location.pathname}`;
                  lastLocationRef.current = `${location.pathname}`;
                  setTimeout(() => {
                    filtersRestoredRef.current = true;
                    isProcessingUrlRef.current = false;
                  }, 100);
                } else {
                  filtersRestoredRef.current = true;
                  isProcessingUrlRef.current = false;
                  lastLocationRef.current = currentUrlKey;
                }
              })
              .catch(error => {
                console.error('Ошибка загрузки категории:', error);
                filtersRestoredRef.current = true;
                isProcessingUrlRef.current = false;
                lastLocationRef.current = currentUrlKey;
              });
          } else {
            // Если это название - используем напрямую
            filtersRestoredRef.current = false;
            // Используем startTransition для всех обновлений состояний
            startTransition(() => {
              setSelectedCategory([categoryParam]);
              // Если есть подкатегория в URL, устанавливаем её
              if (subcategoryParam) {
                setSelectedSubcategory([subcategoryParam]);
              } else {
                setSelectedSubcategory([]);
              }
              setSelectedSubSubcategory([]);
              setSelectedBrand([]);
              setSelectedCondition('all');
              setPriceMin('');
              setPriceMax('');
              setSearchQuery('');
            });
            // Очищаем URL параметры, чтобы избежать повторной обработки
            // НЕ используем window.history.replaceState здесь, чтобы не вызывать циклы
            urlParamsProcessedRef.current = `${location.pathname}`; // Обновляем ключ без search
            lastLocationRef.current = `${location.pathname}`;
            setTimeout(() => {
              filtersRestoredRef.current = true;
              isProcessingUrlRef.current = false;
            }, 100);
          }
        } else {
          // Нет параметров category - помечаем URL как обработанный
          urlParamsProcessedRef.current = currentUrlKey;
          isProcessingUrlRef.current = false;
          lastLocationRef.current = currentUrlKey;
        }
        
        // Если не было параметра category, проверяем referrer (только если не обрабатываем category)
        if (!categoryParam) {
          const referrer = document.referrer || '';
          const isFromProductPage = referrer.includes('/product/') || referrer.includes('/product?');
          const isFromShopPage = referrer.includes('/shop');
          
          // Если пришли с другой страницы (не с product и не с shop) или обновили страницу - сбрасываем фильтры
          // Но только если есть сохраненные фильтры (значит это не первая загрузка с пустыми фильтрами)
          if (!isFromProductPage && !isFromShopPage && referrer) {
            // Переход с другой страницы - сбрасываем фильтры
            const savedFilters = sessionStorage.getItem('shop_filters');
            if (savedFilters) {
              filtersRestoredRef.current = false;
              // Используем startTransition для всех обновлений состояний
              startTransition(() => {
                setSelectedCategory([]);
                setSelectedSubcategory([]);
                setSelectedSubSubcategory([]);
                setSelectedBrand([]);
                setPriceMin('');
                setPriceMax('');
                setSelectedRating(null);
                setSearchQuery('');
              });
              sessionStorage.removeItem('shop_filters');
              setTimeout(() => {
                filtersRestoredRef.current = true;
                lastLocationRef.current = currentUrlKey;
              }, 100);
            } else {
              filtersRestoredRef.current = true;
              lastLocationRef.current = currentUrlKey;
            }
          } else if (!referrer) {
            // Нет referrer - это обновление страницы, сбрасываем фильтры
            sessionStorage.removeItem('shop_filters');
            filtersRestoredRef.current = true;
            urlParamsProcessedRef.current = currentUrlKey;
            isProcessingUrlRef.current = false;
            lastLocationRef.current = currentUrlKey;
          } else {
            // Пришли с shop или product, но флага нет - возможно, это внутренняя навигация, ничего не делаем
            filtersRestoredRef.current = true;
            urlParamsProcessedRef.current = currentUrlKey;
            isProcessingUrlRef.current = false;
            lastLocationRef.current = currentUrlKey;
          }
        }
      }
    // ВАЖНО: Используем только location.pathname, чтобы избежать циклов при изменении search
    // location.search проверяем внутри через currentUrlKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Сохраняем состояние фильтров при их изменении (но не сразу после восстановления)
  useEffect(() => {
    // Пропускаем сохранение сразу после восстановления фильтров
    if (!filtersRestoredRef.current) {
      return;
    }

    // Пропускаем сохранение, если обрабатываем URL параметры
    if (isProcessingUrlRef.current) {
      return;
    }

    // Сохраняем фильтры в sessionStorage только если мы на странице каталога
    if (location.pathname.includes('/shop')) {
      try {
        const filters = {
          category: selectedCategory,
          subcategory: selectedSubcategory,
          subSubcategory: selectedSubSubcategory,
          brand: selectedBrand,
          priceMin,
          priceMax,
          selectedRating,
          searchQuery,
        };
        // Используем JSON.stringify с проверкой, чтобы избежать циклических ссылок
        const filtersString = JSON.stringify(filters);
        
        // Сохраняем только если фильтры изменились
        if (filtersString !== prevSavedFiltersRef.current) {
          prevSavedFiltersRef.current = filtersString;
          sessionStorage.setItem('shop_filters', filtersString);
        }
      } catch (error) {
        console.error('Ошибка сохранения фильтров:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedBrand, priceMin, priceMax, selectedRating, searchQuery]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.entities.Product.list(),
  });

  // Отладка: логируем данные о товарах при изменении фильтров
  // УДАЛЕН: useEffect с console.log может вызывать бесконечные циклы
  // useEffect(() => {
  //   if (selectedCategory.length > 0 || selectedSubcategory.length > 0) {
  //     console.log('🔍 Фильтры:', {
  //       selectedCategory,
  //       selectedSubcategory
  //     });
  //     const sampleProducts = products.slice(0, 3);
  //     console.log('📦 Примеры товаров:', sampleProducts.map(p => ({
  //       name: p.name,
  //       category_name: p.category_name,
  //       subcategory_name: p.subcategory_name,
  //       brand: p.brand
  //     })));
  //   }
  // }, [selectedCategory, selectedSubcategory, products]);

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
      // Показываем уведомление
      setShowCartNotification(true);
      // Скрываем уведомление через 2 секунды
      setTimeout(() => {
        setShowCartNotification(false);
      }, 2000);
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

  // Функция для проверки совпадения поискового запроса с категориями
  const getCategoryFromSearch = (query) => {
    if (!query || !query.trim()) return null;
    const normalizedQuery = query.trim().toLowerCase();
    
    // Маппинг поисковых запросов на названия категорий
    const categoryMap = {
      'фотоаппарат': 'Фотоаппараты',
      'фотоаппараты': 'Фотоаппараты',
      'объектив': 'Объективы',
      'объективы': 'Объективы',
      'видеокамера': 'Видеокамеры',
      'видеокамеры': 'Видеокамеры',
      'вспышка': 'Вспышки',
      'вспышки': 'Вспышки',
      'штатив': 'Штативы',
      'штативы': 'Штативы',
      'аксессуар': 'Аксессуары',
      'аксессуары': 'Аксессуары',
      'карта памяти': 'Карты памяти',
      'карты памяти': 'Карты памяти',
      'бинокль': 'Бинокли',
      'бинокли': 'Бинокли',
    };
    
    // Проверяем точное совпадение
    if (categoryMap[normalizedQuery]) {
      return { category: categoryMap[normalizedQuery], remainingQuery: '' };
    }
    
    // Проверяем, начинается ли запрос с названия категории
    for (const [key, categoryName] of Object.entries(categoryMap)) {
      if (normalizedQuery.startsWith(key)) {
        const remainingQuery = normalizedQuery.substring(key.length).trim();
        return { category: categoryName, remainingQuery };
      }
    }
    
    return null;
  };

  const filteredProducts = products
    .filter(p => {
      // Фильтр по основной категории (множественный выбор)
      // Преобразуем ключи категорий в их названия (labels) для сравнения
      if (selectedCategory.length > 0) {
        // selectedCategory теперь содержит названия категорий из БД напрямую
        const categoryLabels = selectedCategory.map(catName => catName.trim());
        // Проверяем обе категории (основную и вторую)
        const productCategoryMatch = categoryLabels.some(catLabel => {
          const normalizedCatLabel = (catLabel || '').trim();
          const normalizedProductCat = (p.category_name || '').trim();
          const normalizedProductCat2 = (p.category_name_2 || '').trim();
          return normalizedCatLabel === normalizedProductCat || 
                 normalizedCatLabel === normalizedProductCat2;
        });
        if (!productCategoryMatch) return false;
      }
      
      // Фильтр по подкатегории (множественный выбор)
      // Подкатегории уже приходят как названия (например 'Sony'), сравниваем напрямую
      const subcategoryArray = Array.isArray(selectedSubcategory) ? selectedSubcategory : (selectedSubcategory ? [selectedSubcategory] : []);
      if (subcategoryArray.length > 0) {
        // Проверяем точное совпадение названия подкатегории
        const productSubcategoryMatch = subcategoryArray.some(subcat => {
          // Сравниваем без учета регистра и пробелов
          const normalizedSubcat = (subcat || '').trim();
          const normalizedProductSubcat = (p.subcategory_name || '').trim();
          return normalizedSubcat === normalizedProductSubcat;
        });
        if (!productSubcategoryMatch) return false;
      }
      
      // Фильтр по под-подкатегории (множественный выбор)
      const subSubcategoryArray = Array.isArray(selectedSubSubcategory) ? selectedSubSubcategory : (selectedSubSubcategory ? [selectedSubSubcategory] : []);
      if (subSubcategoryArray.length > 0) {
        const productSubSubcategoryMatch = subSubcategoryArray.some(subsubcat => {
          const normalizedSubsubcat = (subsubcat || '').trim();
          const normalizedProductSubsubcat = (p.subsubcategory_name || '').trim();
          return normalizedSubsubcat === normalizedProductSubsubcat;
        });
        if (!productSubSubcategoryMatch) return false;
      }
      
      return true;
    })
    .filter(p => {
      // Фильтр по бренду (множественный выбор)
      if (selectedBrand.length > 0) {
        return selectedBrand.includes(p.brand);
      }
      return true;
    })
    // Убрали фильтр по состоянию - всегда только новые товары
    .filter(p => !p.condition || p.condition === 'new')
    .filter(p => {
      // Фильтр по рейтингу
      if (selectedRating !== null && selectedRating !== undefined) {
        const productRating = parseFloat(p.rating) || 0;
        
        // "Менее 3 звезд" - рейтинг от 0 до 2.99
        if (selectedRating === 'less_than_3') {
          return productRating >= 0 && productRating < 3.00;
        }
        
        // Точное значение для 3, 4, 5 звезд
        if (typeof selectedRating === 'number') {
          return Math.abs(productRating - selectedRating) < 0.01;
        }
      }
      return true;
    })
    .filter(p => !priceMin || p.price >= Number(priceMin))
    .filter(p => !priceMax || p.price <= Number(priceMax))
    .filter(p => {
      if (!searchQuery || !searchQuery.trim()) return true;
      
      const categoryFromSearch = getCategoryFromSearch(searchQuery);
      
      // Если поисковый запрос совпадает с категорией
      if (categoryFromSearch) {
        // Проверяем, что товар из нужной категории
        const matchesCategory = p.category_name === categoryFromSearch.category;
        
        // Если есть дополнительный поисковый запрос после названия категории
        if (categoryFromSearch.remainingQuery) {
          const normalizedName = (p.name || '').toLowerCase();
          const normalizedBrand = (p.brand || '').toLowerCase();
          const matchesName = normalizedName.includes(categoryFromSearch.remainingQuery);
          const matchesBrand = normalizedBrand.includes(categoryFromSearch.remainingQuery);
          
          return matchesCategory && (matchesName || matchesBrand);
        }
        
        // Если только название категории - показываем все товары из категории
        return matchesCategory;
      }
      
      // Обычный поиск по названию товара и бренду
      const normalizedQuery = searchQuery.toLowerCase();
      const normalizedName = (p.name || '').toLowerCase();
      const normalizedBrand = (p.brand || '').toLowerCase();
      
      return normalizedName.includes(normalizedQuery) || normalizedBrand.includes(normalizedQuery);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return (a.price || 0) - (b.price || 0);
        case 'price-high': return (b.price || 0) - (a.price || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest': return new Date(b.created_date) - new Date(a.created_date);
        default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  // Пагинация
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Сброс на первую страницу при изменении фильтров
  // Используем useRef для отслеживания предыдущих значений, чтобы избежать лишних обновлений
  const prevFiltersStringRef = useRef(null);
  
  useEffect(() => {
    const currentFilters = {
      category: selectedCategory,
      subcategory: selectedSubcategory,
      subSubcategory: selectedSubSubcategory,
      brand: selectedBrand,
      priceMin,
      priceMax,
      selectedRating,
      searchQuery,
      sortBy,
    };
    
    const currentFiltersString = JSON.stringify(currentFilters);
    
    // Инициализируем при первом рендере
    if (prevFiltersStringRef.current === null) {
      prevFiltersStringRef.current = currentFiltersString;
      return;
    }
    
    // Сравниваем текущие фильтры с предыдущими
    if (currentFiltersString !== prevFiltersStringRef.current) {
      prevFiltersStringRef.current = currentFiltersString;
      // Сбрасываем страницу только если она не первая
      setCurrentPage(prev => {
        if (prev !== 1) {
          return 1;
        }
        return prev;
      });
    }
  }, [selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedBrand, priceMin, priceMax, selectedRating, searchQuery, sortBy]);

  // Скролл наверх при смене страницы
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const resetFilters = () => {
    setSelectedCategory([]);
    setSelectedSubcategory([]);
    setSelectedSubSubcategory([]);
    setSelectedBrand([]);
    setPriceMin('');
    setPriceMax('');
    setSelectedRating(null);
    setSearchQuery('');
    // Очищаем сохраненные фильтры при явном сбросе
    sessionStorage.removeItem('shop_filters');
  };

  // Обработчики для каскадного выбора категорий
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // При изменении категории сбрасываем подкатегории
    setSelectedSubcategory([]);
    setSelectedSubSubcategory([]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Шапка */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Каталог товаров</h1>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full border-slate-200 focus:ring-slate-900"
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-full sm:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setCartOpen(true)}
                className="rounded-full relative"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Корзина
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-8">
          {/* Боковая панель фильтров */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-2xl p-6 pb-12 shadow-sm mb-8 lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-900">Фильтры</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Сбросить
                </Button>
              </div>
              
              <div className="relative">
                <div className={`transition-all duration-300 relative ${
                  !filtersExpanded 
                    ? 'max-h-[400px] overflow-hidden lg:max-h-none lg:overflow-visible' 
                    : 'max-h-none overflow-visible'
                }`}>
                  <CategoryFilter
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleCategoryChange}
                    selectedSubcategory={selectedSubcategory}
                    setSelectedSubcategory={(subcat) => {
                      setSelectedSubcategory(subcat);
                      setSelectedSubSubcategory([]);
                    }}
                    selectedSubSubcategory={selectedSubSubcategory}
                    setSelectedSubSubcategory={setSelectedSubSubcategory}
                    priceMin={priceMin}
                    setPriceMin={setPriceMin}
                    priceMax={priceMax}
                    setPriceMax={setPriceMax}
                    selectedRating={selectedRating}
                    setSelectedRating={setSelectedRating}
                  />
                  
                  {/* Градиентная маска для свернутых фильтров на мобильных */}
                  {!filtersExpanded && (
                    <div className="lg:hidden absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
                  )}
                </div>
                
                {/* Кнопка "Развернуть фильтры" для мобильных */}
                {!filtersExpanded && (
                  <div className="lg:hidden mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFiltersExpanded(true)}
                      className="w-full rounded-full"
                    >
                      Развернуть фильтры
                    </Button>
                  </div>
                )}
                
                {filtersExpanded && (
                  <div className="lg:hidden mt-4 pt-4 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFiltersExpanded(false)}
                      className="w-full rounded-full"
                    >
                      Свернуть фильтры
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </aside>
          
          {/* Сетка товаров */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">
                Найдено: {filteredProducts.length} товаров
                {totalPages > 1 && (
                  <span className="ml-2">
                    (страница {currentPage} из {totalPages})
                  </span>
                )}
              </p>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-44 rounded-full">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Популярные</SelectItem>
                  <SelectItem value="newest">Новинки</SelectItem>
                  <SelectItem value="price-low">Сначала дешевле</SelectItem>
                  <SelectItem value="price-high">Сначала дороже</SelectItem>
                  <SelectItem value="rating">По рейтингу</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6">
                    <Skeleton className="aspect-square rounded-xl mb-4" />
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-5 w-full mb-4" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Ничего не найдено</h3>
                <p className="text-slate-500 mb-6">Попробуйте изменить параметры поиска</p>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="rounded-full"
                >
                  Сбросить фильтры
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={false}
              >
                <AnimatePresence mode="wait">
                  {paginatedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ 
                        duration: 0.25,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <ProductCard 
                        product={product} 
                        onAddToCart={(p) => addToCartMutation.mutate(p)} 
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full"
                  >
                    ←
                  </Button>
                  
                  {/* Кнопки страниц */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Показываем первую, последнюю, текущую и соседние страницы
                    const shouldShow = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!shouldShow) {
                      // Показываем многоточие
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-slate-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-full min-w-[40px] ${
                          currentPage === page 
                            ? 'bg-slate-900 text-white hover:bg-slate-800' 
                            : ''
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full"
                  >
                    →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Уведомление о добавлении в корзину */}
      <AnimatePresence>
        {showCartNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 right-4 top-auto left-auto sm:bottom-auto sm:top-6 sm:right-6 z-50 pointer-events-none w-full sm:w-auto px-4 sm:px-0"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pointer-events-auto w-full sm:min-w-[320px] sm:max-w-[400px]"
            >
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 400 }}
                  className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">Успешно добавлено!</p>
                  <p className="text-xs sm:text-sm text-slate-500">Товар добавлен в корзину</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowCartNotification(false);
                  setCartOpen(true);
                }}
                className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm px-4 py-2 w-full sm:w-auto flex-shrink-0"
              >
                Перейти в корзину
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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