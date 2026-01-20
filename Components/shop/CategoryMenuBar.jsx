import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { createPageUrl } from '../../src/utils.js';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function CategoryMenuBar() {
  // ========== ВСЕ ХУКИ В НАЧАЛЕ ==========
  
  // State
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  // Refs
  const dropdownRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  
  // Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Query - ВСЕГДА вызывается
  const { data: allCategories = [], isLoading } = useQuery({
    queryKey: ['all-categories-menu'],
    queryFn: async () => {
      try {
        const response = await fetch(`${apiUrl}/api/categories?all=true`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 минут
    gcTime: 30 * 60 * 1000, // 30 минут
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  
  // Memoized вычисления - ВСЕГДА вызываются
  const mainCategories = useMemo(() => {
    if (!Array.isArray(allCategories) || allCategories.length === 0) return [];
    return allCategories.filter(cat => cat.level === 0 || !cat.level);
  }, [allCategories]);
  
  const orderedCategories = useMemo(() => {
    if (!Array.isArray(mainCategories) || mainCategories.length === 0) return [];
    const order = ['Видеокамеры', 'Фотоаппараты', 'Объективы', 'Экшен-камеры', 'Ноутбуки'];
    return [...mainCategories].sort((a, b) => {
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [mainCategories]);
  
  const getSubcategories = useCallback((categoryId) => {
    if (!Array.isArray(allCategories) || !categoryId) return [];
    return allCategories.filter(cat => cat.parent_id === categoryId);
  }, [allCategories]);
  
  // Callbacks
  const cleanupTimeout = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    cleanupTimeout();
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  }, [cleanupTimeout]);
  
  // Effect для очистки
  useEffect(() => {
    return () => {
      cleanupTimeout();
    };
  }, [cleanupTimeout]);
  
  // ========== УСЛОВНЫЕ ПРОВЕРКИ ПОСЛЕ ВСЕХ ХУКОВ ==========
  
  const isShopPage = location.pathname.includes('/shop') || location.pathname.includes(createPageUrl('Shop'));
  const MAX_VISIBLE = 5;
  
  // Ранний возврат ТОЛЬКО после всех хуков
  if (isLoading || isShopPage || !Array.isArray(orderedCategories) || orderedCategories.length === 0) {
    return null;
  }
  
  const visibleCategories = orderedCategories.slice(0, MAX_VISIBLE);
  const hiddenCategories = orderedCategories.slice(MAX_VISIBLE);
  
  // ========== РЕНДЕР ==========
  
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-[76.8px] z-30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
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
            if (!category || !category.id) return null;
            
            const subcategories = getSubcategories(category.id);
            const hasSubs = Array.isArray(subcategories) && subcategories.length > 0;
            const isHovered = hoveredCategory === category.id;

            return (
              <div
                key={category.id}
                className="relative flex-1"
                onMouseEnter={() => {
                  cleanupTimeout();
                  setHoveredCategory(category.id);
                }}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name || '')}`}
                  className="flex items-center justify-center gap-2 px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
                  onClick={() => navigate(`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name || '')}`)}
                >
                  {category.name || 'Категория'}
                  {hasSubs && <ChevronDown className="h-5 w-5 text-slate-500" />}
                </Link>
              </div>
            );
          })}
          
          {/* Кнопка "Еще" */}
          {hiddenCategories.length > 0 && (
            <div
              className="relative flex-1"
              onMouseEnter={() => {
                cleanupTimeout();
                setHoveredCategory('more');
              }}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to={createPageUrl('Shop')}
                className="flex items-center justify-center gap-2 px-4 py-4 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap"
                onClick={() => navigate(createPageUrl('Shop'))}
              >
                Еще
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </Link>
            </div>
          )}
        </nav>

        {/* Выпадающее меню для категорий */}
        <AnimatePresence>
          {hoveredCategory && hoveredCategory !== 'more' && (() => {
            const category = visibleCategories.find(c => c && c.id === hoveredCategory);
            if (!category) return null;
            
            const subcategories = getSubcategories(category.id);
            if (!Array.isArray(subcategories) || subcategories.length === 0) return null;
            
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
                  setHoveredCategory(category.id);
                }}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-3 gap-4">
                  {subcategories.map((sub) => {
                    if (!sub || !sub.id) return null;
                    return (
                      <Link
                        key={sub.id}
                        to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name || '')}&subcategory=${encodeURIComponent(sub.name || '')}`}
                        className="block px-4 py-3 text-base font-bold text-slate-900 hover:bg-slate-50 transition-colors rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name || '')}&subcategory=${encodeURIComponent(sub.name || '')}`);
                        }}
                      >
                        {sub.name || 'Подкатегория'}
                      </Link>
                    );
                  })}
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
                setHoveredCategory('more');
              }}
              onMouseLeave={handleMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4">
                {hiddenCategories.map((category) => {
                  if (!category || !category.id) return null;
                  return (
                    <Link
                      key={category.id}
                      to={`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name || '')}`}
                      className="block px-4 py-3 text-base text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors rounded-lg"
                      onClick={() => navigate(`${createPageUrl('Shop')}?category=${encodeURIComponent(category.name || '')}`)}
                    >
                      {category.name || 'Категория'}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
