import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { createPageUrl } from '../../src/utils.js';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function CategoryMenuBar() {
  // ВСЕ хуки должны быть вызваны ПЕРВЫМИ, до любых условных возвратов
  
  // 1. useState хуки
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ left: 0, width: 0 });
  
  // 2. useRef хуки
  const categoryRefs = useRef({});
  const dropdownRef = useRef(null);
  const menuContainerRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  
  // 3. Router хуки
  const navigate = useNavigate();
  const location = useLocation();
  
  // 4. useQuery хук - ВСЕГДА вызывается
  const { data: allCategoriesDataRaw = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['all-categories-menu'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories?all=true`);
      if (!response.ok) return [];
      const data = await response.json();
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    structuralSharing: (oldData, newData) => {
      if (!oldData || !newData) return newData || oldData;
      if (oldData.length !== newData.length) return newData;
      const oldIds = oldData.map(c => c.id).sort().join(',');
      const newIds = newData.map(c => c.id).sort().join(',');
      return oldIds === newIds ? oldData : newData;
    },
  });
  
  // 5. useMemo хуки - ВСЕГДА вызываются
  const allCategoriesData = useMemo(() => {
    return allCategoriesDataRaw || [];
  }, [allCategoriesDataRaw]);
  
  const mainCategories = useMemo(() => {
    if (!allCategoriesData || allCategoriesData.length === 0) return [];
    return allCategoriesData.filter(cat => cat.level === 0);
  }, [allCategoriesData]);

  const orderedCategories = useMemo(() => {
    if (!mainCategories || mainCategories.length === 0) return [];
    const order = ['Видеокамеры', 'Фотоаппараты', 'Объективы', 'Экшен-камеры', 'Ноутбуки'];
    const sorted = [...mainCategories].sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [mainCategories]);
  
  // 6. useCallback хуки - ВСЕГДА вызываются
  const cleanupTimeout = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);
  
  const getSubcategories = useCallback((categoryId) => {
    return allCategoriesData.filter(cat => cat.parent_id === categoryId);
  }, [allCategoriesData]);
  
  const handleCategoryMouseLeave = useCallback((e) => {
    cleanupTimeout();
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && dropdownRef.current?.contains(relatedTarget)) {
      return;
    }
    leaveTimeoutRef.current = setTimeout(() => {
      if (!dropdownRef.current?.matches(':hover')) {
        setHoveredCategory(null);
      }
    }, 150);
  }, [cleanupTimeout]);
  
  const handleDropdownMouseLeave = useCallback(() => {
    cleanupTimeout();
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  }, [cleanupTimeout]);
  
  const handleCategoryClick = useCallback((categoryName) => {
    navigate(`${createPageUrl('Shop')}?category=${categoryName}`);
  }, [navigate]);
  
  const handleSubcategoryClick = useCallback((e, subcategoryName, categoryName) => {
    e.preventDefault();
    const url = `${createPageUrl('Shop')}?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`;
    navigate(url);
  }, [navigate]);
  
  // 7. useEffect хук - ВСЕГДА вызывается
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
    };
  }, []);
  
  // ТОЛЬКО ПОСЛЕ ВСЕХ ХУКОВ - условные проверки и возвраты
  const MAX_VISIBLE_CATEGORIES = 5;
  const isShopPage = location.pathname.includes('/shop') || location.pathname.includes(createPageUrl('Shop'));
  
  // Условный возврат - ПОСЛЕ всех хуков
  if (isLoadingCategories || isShopPage || orderedCategories.length === 0) {
    return null;
  }
  
  // Остальная логика компонента
  const visibleCategories = orderedCategories.slice(0, MAX_VISIBLE_CATEGORIES);
  const hiddenCategories = orderedCategories.slice(MAX_VISIBLE_CATEGORIES);

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[76.8px] z-30 relative">
      <div ref={menuContainerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Мобильная версия */}
        <div className="md:hidden">
          <Link
            to={createPageUrl('Shop')}
            className="block w-full px-4 py-4 text-base font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100 transition-colors text-center"
          >
            Каталог товаров
          </Link>
        </div>

        {/* Десктопная версия */}
        <nav className="hidden md:flex items-center w-full">
          {visibleCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const hasSubcategories = subcategories.length > 0;

            return (
              <div
                key={category.id}
                ref={(el) => (categoryRefs.current[category.id] = el)}
                className="relative flex-1"
                onMouseEnter={() => {
                  cleanupTimeout();
                  if (hoveredCategory !== category.id) {
                    setHoveredCategory(category.id);
                  }
                }}
                onMouseLeave={handleCategoryMouseLeave}
              >
                <Link
                  to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center justify-center gap-2 px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap relative w-full"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  {category.name}
                  {hasSubcategories && (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </Link>
              </div>
            );
          })}
          
          {/* Блок "Еще" */}
          {hiddenCategories.length > 0 && (
            <div
              ref={(el) => (categoryRefs.current['more'] = el)}
              className="relative flex-1"
              onMouseEnter={() => {
                cleanupTimeout();
                if (hoveredCategory !== 'more') {
                  setHoveredCategory('more');
                }
              }}
              onMouseLeave={handleCategoryMouseLeave}
            >
              <Link
                to={createPageUrl('Shop')}
                className="flex items-center justify-center gap-2 px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap relative w-full"
                onClick={() => navigate(createPageUrl('Shop'))}
              >
                Еще
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </Link>
            </div>
          )}
        </nav>

        {/* Выпадающее меню с подкатегориями */}
        <AnimatePresence>
          {hoveredCategory && hoveredCategory !== 'more' && (() => {
            const category = visibleCategories.find(c => c.id === hoveredCategory);
            if (!category) return null;
            const subcategories = getSubcategories(category.id);
            if (subcategories.length === 0) return null;
            
            return (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-[100]"
                onMouseEnter={() => {
                  cleanupTimeout();
                  if (hoveredCategory !== category.id) {
                    setHoveredCategory(category.id);
                  }
                }}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <div className="grid grid-cols-3 gap-4">
                  {subcategories.map((subcategory) => (
                    <Link
                      key={subcategory.id}
                      to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcategory.name)}`}
                      className="block px-4 py-3 text-base font-bold text-slate-900 hover:bg-slate-50 transition-colors rounded-lg"
                      onClick={(e) => handleSubcategoryClick(e, subcategory.name, category.name)}
                    >
                      {subcategory.name}
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Выпадающее меню "Еще" */}
        <AnimatePresence>
          {hoveredCategory === 'more' && hiddenCategories.length > 0 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50"
              onMouseEnter={() => {
                cleanupTimeout();
                if (hoveredCategory !== 'more') {
                  setHoveredCategory('more');
                }
              }}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4">
                {hiddenCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name)}`}
                    className="block px-4 py-3 text-base text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors rounded-lg"
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
