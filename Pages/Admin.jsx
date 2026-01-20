import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuth } from '../src/utils/auth.js';
import { Button } from '../Components/ui/button.jsx';
import { Input } from '../Components/ui/input.jsx';
import { Label } from '../Components/ui/label.jsx';
import { Textarea } from '../Components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Components/ui/select.jsx';
import { Checkbox } from '../Components/ui/checkbox.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Components/ui/dialog.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../Components/ui/allert-dialog.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CATEGORIES, ORDER_STATUSES } from '../src/utils/categories.js';
import { SettingsManager, MessagesManager } from './Admin_SettingsMessages.jsx';

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminAuth.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminAuth.login(username, password);
    
    if (result.success) {
      setIsAuthenticated(true);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    adminAuth.logout();
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Админ-панель
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminPanel onLogout={handleLogout} />
  );
}

function AdminPanel({ onLogout }) {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Админ-панель</h1>
            <Button onClick={onLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Боковое меню - на мобильных горизонтальное */}
          <div className="flex lg:flex-col gap-2 lg:w-48 overflow-x-auto pb-2 lg:pb-0">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'products'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Товары
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Заказы
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'categories'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Категории
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'brands'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Бренды
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Настройки
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'messages'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Сообщения
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm relative ${
                activeTab === 'chats'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Чаты
            </button>
            <button
              onClick={() => setActiveTab('blocked-ips')}
              className={`flex-shrink-0 lg:w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === 'blocked-ips'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Заблокированные IP
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === 'products' && <ProductsManager />}
            {activeTab === 'orders' && <OrdersManager />}
            {activeTab === 'categories' && <CategoriesManager />}
            {activeTab === 'brands' && <BrandsManager />}
            {activeTab === 'settings' && <SettingsManager />}
            {activeTab === 'messages' && <MessagesManager />}
            {activeTab === 'chats' && <ChatsManager />}
            {activeTab === 'blocked-ips' && <BlockedIPsManager />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент управления товарами
function ProductsManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchArticle, setSearchArticle] = useState('');
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/products`);
      if (!response.ok) throw new Error('Ошибка загрузки товаров');
      return response.json();
    },
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

  // Фильтрация товаров по поисковому запросу
  const filteredProducts = products.filter((product) => {
    // Поиск по артикулу (ID) - только если указан артикул и не указан обычный поиск
    // Точное совпадение для артикула
    if (searchArticle.trim() && !searchQuery.trim()) {
      return String(product.id) === searchArticle.trim();
    }
    
    // Если указан артикул, пропускаем товары, не совпадающие точно по ID
    if (searchArticle.trim() && String(product.id) !== searchArticle.trim()) {
      return false;
    }
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    
    // Поиск по ID
    const idMatch = String(product.id).includes(query);
    
    // Поиск по названию товара
    const nameMatch = product.name?.toLowerCase().includes(query);
    
    // Поиск по бренду
    const brandMatch = product.brand?.toLowerCase().includes(query);
    
    // Поиск по категориям (category_name, subcategory_name, subsubcategory_name)
    const categoryMatch = product.category_name?.toLowerCase().includes(query) ||
                         product.subcategory_name?.toLowerCase().includes(query) ||
                         product.subsubcategory_name?.toLowerCase().includes(query);
    
    // Умный поиск по категориям (как в каталоге)
    const categoryFromSearch = getCategoryFromSearch(searchQuery);
    let smartCategoryMatch = false;
    
    if (categoryFromSearch) {
      smartCategoryMatch = product.category_name === categoryFromSearch.category ||
                          product.subcategory_name === categoryFromSearch.category ||
                          product.subsubcategory_name === categoryFromSearch.category;
      
      // Если есть дополнительный запрос после названия категории
      if (categoryFromSearch.remainingQuery && smartCategoryMatch) {
        const normalizedName = (product.name || '').toLowerCase();
        const normalizedBrand = (product.brand || '').toLowerCase();
        return normalizedName.includes(categoryFromSearch.remainingQuery) ||
               normalizedBrand.includes(categoryFromSearch.remainingQuery);
      }
      
      if (smartCategoryMatch) return true;
    }
    
    return idMatch || nameMatch || brandMatch || categoryMatch || smartCategoryMatch;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${apiUrl}/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Ошибка удаления');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Товар удален');
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Управление товарами</h2>
        <Button onClick={() => { setShowForm(true); setEditingProduct(null); }} className="w-full sm:w-auto">
          + Добавить товар
        </Button>
      </div>

      {/* Поиск */}
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div>
          <Input
            type="text"
            placeholder="Поиск по названию, категории или бренду..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSearchArticle('');
            }}
            className="w-full"
          />
        </div>
        <div>
          <Input
            type="text"
            placeholder="Поиск по артикулу (ID)..."
            value={searchArticle}
            onChange={(e) => {
              setSearchArticle(e.target.value);
              if (e.target.value) setSearchQuery('');
            }}
            className="w-full"
          />
        </div>
        {(searchQuery || searchArticle) && (
          <p className="text-sm text-slate-500">
            Найдено товаров: {filteredProducts.length}
          </p>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          }}
        />
      )}

      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* На мобильных - карточки, на десктопе - таблица */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">ID</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Название</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Категория</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Цена</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 sm:px-4 py-8 text-center text-slate-500">
                      {searchQuery ? 'Товары не найдены' : 'Нет товаров'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    // Формируем строку категории: основная / подкатегория / под-подкатегория
                    const categoryPath = [
                      product.category_name,
                      product.subcategory_name,
                      product.subsubcategory_name
                    ].filter(Boolean).join(' / ') || '-';
                    
                    return (
                    <tr key={product.id}>
                      <td className="px-3 sm:px-4 py-3 text-sm">{product.id}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm">{product.name}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-slate-600">{categoryPath}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm">{product.price} ₽</td>
                      <td className="px-3 sm:px-4 py-3 text-sm">{product.brand || '-'}</td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingProduct(product); setShowForm(true); }}
                            className="text-xs sm:text-sm"
                          >
                            Редактировать
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="text-xs sm:text-sm"
                          >
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Мобильный вид - карточки */}
          <div className="md:hidden divide-y">
            {filteredProducts.length === 0 && searchQuery ? (
              <div className="p-4 text-center text-slate-500">
                Товары не найдены
              </div>
            ) : (
              filteredProducts.map((product) => (
              <div key={product.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">ID: {product.id}</p>
                  </div>
                  <p className="font-bold text-slate-900">{product.price} ₽</p>
                </div>
                {(() => {
                  const categoryPath = [
                    product.category_name,
                    product.subcategory_name,
                    product.subsubcategory_name
                  ].filter(Boolean).join(' / ') || 'Без категории';
                  return (
                    <p className="text-sm text-slate-600">Категория: {categoryPath}</p>
                  );
                })()}
                {product.brand && (
                  <p className="text-sm text-slate-600">Бренд: {product.brand}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingProduct(product); setShowForm(true); }}
                    className="flex-1 text-sm"
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(product.id)}
                    className="flex-1 text-sm"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Форма добавления/редактирования товара
function ProductForm({ product, onClose, onSuccess }) {
  // Парсим specs если это строка
  let parsedSpecs = {};
  if (product?.specs) {
    if (typeof product.specs === 'string') {
      try {
        parsedSpecs = JSON.parse(product.specs);
      } catch (e) {
        parsedSpecs = {};
      }
    } else {
      parsedSpecs = product.specs;
    }
  }

  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    original_price: product?.original_price || '',
    image_url: product?.image_url || '',
    images: product?.images || [],
    category: product?.category_name || product?.category || '',
    subcategory: product?.subcategory_name || product?.subcategory || '',
    subsubcategory: product?.subsubcategory_name || product?.subsubcategory || '',
    category_2: product?.category_name_2 || product?.category_2 || '',
    in_stock: product?.in_stock ?? true,
    featured: product?.featured ?? false,
    popular: product?.popular ?? false,
    on_sale: product?.on_sale ?? false,
    condition: product?.condition || 'new',
    rating: product?.rating || '',
    specs: parsedSpecs,
  });

  const [specsList, setSpecsList] = useState(
    Object.entries(parsedSpecs).map(([key, value]) => ({ key, value: String(value) }))
  );

  const [imagesList, setImagesList] = useState(
    Array.isArray(formData.images) ? formData.images : []
  );

  // Обновляем imagesList когда загружается товар для редактирования
  useEffect(() => {
    if (product?.images && Array.isArray(product.images)) {
      setImagesList(product.images);
    } else {
      setImagesList([]);
    }
  }, [product]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Получить доступные подкатегории для выбранной категории
  const getSubcategories = () => {
    if (!formData.category || !CATEGORIES[formData.category]) return [];
    const subcats = CATEGORIES[formData.category].subcategories;
    return Object.keys(subcats || {});
  };

  // Получить доступные под-подкатегории для выбранной подкатегории
  const getSubSubcategories = () => {
    if (!formData.category || !formData.subcategory) return [];
    const subcats = CATEGORIES[formData.category]?.subcategories;
    if (!subcats || !subcats[formData.subcategory]) return [];
    
    const subcat = subcats[formData.subcategory];
    // Если это массив, вернуть его
    if (Array.isArray(subcat)) return subcat;
    // Если это объект с subcategories, вернуть массив
    if (subcat.subcategories && Array.isArray(subcat.subcategories)) {
      return subcat.subcategories;
    }
    return [];
  };

  // Обработчики изменений категорий (сброс зависимых полей)
  const handleCategoryChange = (category) => {
    setFormData({
      ...formData,
      category,
      subcategory: '',
      subsubcategory: '',
    });
  };

  const handleSubcategoryChange = (subcategory) => {
    setFormData({
      ...formData,
      subcategory,
      subsubcategory: '',
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const url = product
        ? `${apiUrl}/api/products/${product.id}`
        : `${apiUrl}/api/products`;
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      return response.json();
    },
    onSuccess: () => {
      toast.success(product ? 'Товар обновлен' : 'Товар создан');
      onSuccess();
    },
  });

  const addSpec = () => {
    setSpecsList([...specsList, { key: '', value: '' }]);
  };

  const removeSpec = (index) => {
    setSpecsList(specsList.filter((_, i) => i !== index));
  };

  const updateSpec = (index, field, value) => {
    const updated = [...specsList];
    updated[index] = { ...updated[index], [field]: value };
    setSpecsList(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Преобразуем список характеристик в объект
    const specsObj = {};
    specsList.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        specsObj[key.trim()] = value.trim();
      }
    });

    // Фильтруем пустые URL изображений
    const filteredImages = imagesList.filter(img => img.trim());

    // Преобразуем категории в формат для API
    const submitData = {
      ...formData,
      images: filteredImages,
      category_name: formData.category,
      subcategory_name: formData.subcategory || null,
      subsubcategory_name: formData.subsubcategory || null,
      category_name_2: formData.category_2 || null,
      specs: specsObj,
    };
    saveMutation.mutate(submitData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold mb-4">
        {product ? 'Редактировать товар' : 'Добавить товар'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Название</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Описание</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Цена</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Старая цена (для скидки)</Label>
            <Input
              type="number"
              value={formData.original_price}
              onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Основное изображение</Label>
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const formData = new FormData();
                    formData.append('image', file);
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                    const response = await fetch(`${apiUrl}/api/upload/image`, {
                      method: 'POST',
                      body: formData,
                    });
                    if (response.ok) {
                      const data = await response.json();
                      setFormData(prev => ({ ...prev, image_url: data.filePath }));
                      toast.success('Изображение загружено');
                    } else {
                      toast.error('Ошибка загрузки изображения');
                    }
                  } catch (error) {
                    console.error('Ошибка загрузки:', error);
                    toast.error('Ошибка загрузки изображения');
                  }
                }
              }}
              className="cursor-pointer"
            />
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="Или введите URL изображения"
            />
            {formData.image_url && (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <img 
                  src={formData.image_url.startsWith('http') || formData.image_url.startsWith('/') ? formData.image_url : `/${formData.image_url}`}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Дополнительные изображения</Label>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      try {
                        const formData = new FormData();
                        files.forEach(file => formData.append('images', file));
                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                        const response = await fetch(`${apiUrl}/api/upload/images`, {
                          method: 'POST',
                          body: formData,
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setImagesList(prev => [...prev, ...data.filePaths]);
                          toast.success(`Загружено изображений: ${data.filePaths.length}`);
                        } else {
                          toast.error('Ошибка загрузки изображений');
                        }
                      } catch (error) {
                        console.error('Ошибка загрузки:', error);
                        toast.error('Ошибка загрузки изображений');
                      }
                    }
                  };
                  input.click();
                }}
              >
                📁 Загрузить файлы
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setImagesList([...imagesList, ''])}>
                + Добавить URL
              </Button>
            </div>
          </div>
          <div className="space-y-2 border rounded-lg p-4 bg-slate-50">
            {imagesList.length === 0 ? (
              <p className="text-sm text-slate-500">Дополнительные изображения не добавлены</p>
            ) : (
              imagesList.map((img, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="URL изображения или путь к файлу"
                    value={img}
                    onChange={(e) => {
                      const updated = [...imagesList];
                      updated[index] = e.target.value;
                      setImagesList(updated);
                    }}
                    className="flex-1"
                  />
                  {img && (
                    <div className="relative w-16 h-16 border rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={img.startsWith('http') || img.startsWith('/') ? img : `/${img}`}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImagesList(imagesList.filter((_, i) => i !== index))}
                  >
                    Удалить
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Категории */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>Категория</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORIES).map((categoryKey) => (
                  <SelectItem key={categoryKey} value={categoryKey}>
                    {CATEGORIES[categoryKey].label || categoryKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.category && getSubcategories().length > 0 && (
            <div>
              <Label>Подкатегория</Label>
              <Select
                value={formData.subcategory}
                onValueChange={handleSubcategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подкатегорию" />
                </SelectTrigger>
                <SelectContent>
                  {getSubcategories().map((subcat) => (
                    <SelectItem key={subcat} value={subcat}>
                      {subcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.subcategory && getSubSubcategories().length > 0 && (
            <div>
              <Label>Под-подкатегория</Label>
              <Select
                value={formData.subsubcategory}
                onValueChange={(value) => setFormData({ ...formData, subsubcategory: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите под-подкатегорию" />
                </SelectTrigger>
                <SelectContent>
                  {getSubSubcategories().map((subsubcat) => (
                    <SelectItem key={subsubcat} value={subsubcat}>
                      {subsubcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Вторая глобальная категория */}
          <div>
            <Label>Вторая глобальная категория (опционально)</Label>
            <Select
              value={formData.category_2 || 'none'}
              onValueChange={(value) => setFormData({ ...formData, category_2: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите вторую категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не выбрано</SelectItem>
                {Object.keys(CATEGORIES).map((categoryKey) => (
                  <SelectItem key={categoryKey} value={categoryKey}>
                    {CATEGORIES[categoryKey].label || categoryKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Характеристики */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Характеристики (ключ: значение)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSpec}>
              + Добавить
            </Button>
          </div>
          <div className="space-y-2 border rounded-lg p-4 bg-slate-50">
            {specsList.length === 0 ? (
              <p className="text-sm text-slate-500">Характеристики не добавлены</p>
            ) : (
              specsList.map((spec, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Ключ (например: Тип товара)"
                    value={spec.key}
                    onChange={(e) => updateSpec(index, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-slate-400">:</span>
                  <Input
                    placeholder="Значение (например: Видеокамера)"
                    value={spec.value}
                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpec(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.in_stock}
              onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
            />
            В наличии
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            />
            Хит продаж
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.popular}
              onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
            />
            Популярное
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.on_sale}
              onChange={(e) => setFormData({ ...formData, on_sale: e.target.checked })}
            />
            Акция (выгодная цена)
          </label>
        </div>
        <div>
          <Label>Состояние</Label>
          <Select
            value={formData.condition || 'new'}
            onValueChange={(value) => setFormData({ ...formData, condition: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите состояние" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Новое</SelectItem>
              <SelectItem value="used">Б/У</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}

// Компонент управления заказами
function OrdersManager() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', showArchived, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('archived', showArchived.toString());
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(`${apiUrl}/api/orders?${params.toString()}`);
      if (!response.ok) throw new Error('Ошибка загрузки заказов');
      return response.json();
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/products`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderNumber, status }) => {
      const response = await fetch(`${apiUrl}/api/orders/${orderNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Ошибка обновления статуса');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Статус обновлен');
    },
  });

  const archiveOrderMutation = useMutation({
    mutationFn: async ({ orderNumber, archived }) => {
      const response = await fetch(`${apiUrl}/api/orders/${orderNumber}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived }),
      });
      if (!response.ok) throw new Error('Ошибка обновления архива');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      // Обновляем selectedOrder, если он открыт
      if (selectedOrder && selectedOrder.order_number === data.order_number) {
        setSelectedOrder(data);
      }
      toast.success(data.archived ? 'Заказ перенесен в архив' : 'Заказ восстановлен из архива');
    },
  });

  const getStatusLabel = (status) => {
    const statusObj = ORDER_STATUSES.find(s => s.value === status);
    return statusObj?.label || status;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Управление заказами</h2>
        
        <div className="flex flex-wrap gap-3">
          {/* Переключатель активные/архивные */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !showArchived
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Архив
            </button>
          </div>

          {/* Фильтр по статусу */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {ORDER_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Номер</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Клиент</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Сумма</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Статус</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Дата</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 sm:px-4 py-3 text-sm font-medium">#{order.order_number}</td>
                  <td className="px-3 sm:px-4 py-3 text-sm">
                    {order.customer_name || order.customer_email || 'Гость'}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-sm">{order.total} ₽</td>
                  <td className="px-3 sm:px-4 py-3 text-sm">
                    <Select
                      value={order.status}
                      onValueChange={(status) =>
                        updateStatusMutation.mutate({
                          orderNumber: order.order_number,
                          status,
                        })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-sm">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsOrderDialogOpen(true);
                        }}
                        className="text-blue-600 hover:underline text-xs sm:text-sm"
                      >
                        Открыть
                      </button>
                      <button
                        onClick={() => {
                          archiveOrderMutation.mutate({
                            orderNumber: order.order_number,
                            archived: !showArchived,
                          });
                        }}
                        className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm"
                        title={showArchived ? 'Восстановить из архива' : 'В архив'}
                      >
                        {showArchived ? '↩️' : '📦'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {/* Мобильный вид - карточки для заказов */}
          <div className="md:hidden divide-y">
            {orders.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">#{order.order_number}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {order.customer_name || order.customer_email || 'Гость'}
                    </p>
                  </div>
                  <p className="font-bold text-slate-900">{order.total} ₽</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Статус</p>
                    <Select
                      value={order.status}
                      onValueChange={(status) =>
                        updateStatusMutation.mutate({
                          orderNumber: order.order_number,
                          status,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-slate-600">
                    Дата: {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsOrderDialogOpen(true);
                      }}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Открыть заказ →
                    </button>
                    <button
                      onClick={() => {
                        archiveOrderMutation.mutate({
                          orderNumber: order.order_number,
                          archived: !showArchived,
                        });
                      }}
                      className="text-slate-600 hover:text-slate-900 text-sm"
                      title={showArchived ? 'Восстановить из архива' : 'В архив'}
                    >
                      {showArchived ? '↩️ Восстановить' : '📦 В архив'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно с деталями заказа */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Заказ #{selectedOrder.order_number}</DialogTitle>
                <DialogDescription>
                  Дата: {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Информация о клиенте */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Информация о клиенте</h3>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <p><span className="text-slate-600">ФИО:</span> <span className="font-medium">{selectedOrder.customer_name || 'Не указано'}</span></p>
                    <p><span className="text-slate-600">Email:</span> <span className="font-medium">{selectedOrder.customer_email || 'Не указано'}</span></p>
                    <p><span className="text-slate-600">IP адрес:</span> <span className="font-medium font-mono">{selectedOrder.client_ip || 'Не указано'}</span></p>
                  </div>
                </div>

                {/* Способ доставки */}
                {selectedOrder.shipping_address && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Способ доставки</h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      {(() => {
                        const address = typeof selectedOrder.shipping_address === 'string' 
                          ? JSON.parse(selectedOrder.shipping_address) 
                          : selectedOrder.shipping_address;
                        return (
                          <>
                            <p>
                              <span className="text-slate-600">Способ:</span>{' '}
                              <span className="font-medium">
                                {address.delivery_method === 'pickup' && 'Самовывоз из магазина'}
                                {address.delivery_method === 'courier' && 'Доставка курьером'}
                                {address.delivery_method === 'pickup_point' && 'Доставка в пункт выдачи'}
                                {!address.delivery_method && 'Не указан'}
                              </span>
                            </p>
                            {address.delivery_method && address.delivery_method !== 'pickup' && (
                              <>
                                <p><span className="text-slate-600">Город:</span> <span className="font-medium">{address.city || 'Не указано'}</span></p>
                                <p><span className="text-slate-600">Адрес:</span> <span className="font-medium">{address.address || 'Не указано'}</span></p>
                                {address.postal_code && (
                                  <p><span className="text-slate-600">Индекс:</span> <span className="font-medium">{address.postal_code}</span></p>
                                )}
                              </>
                            )}
                            {address.phone && (
                              <p><span className="text-slate-600">Телефон:</span> <span className="font-medium">{address.phone}</span></p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Товары в заказе */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Товары в заказе</h3>
                  <div className="space-y-3">
                    {(() => {
                      const items = typeof selectedOrder.items === 'string' 
                        ? JSON.parse(selectedOrder.items) 
                        : (selectedOrder.items || []);
                      return items.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id);
                        const productImage = product?.images?.[0] || product?.image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L2x0ZXh0Pjwvc3ZnPg==';
                        return (
                          <div key={index} className="flex items-center gap-4 bg-slate-50 rounded-lg p-3">
                            <img
                              src={productImage}
                              alt={item.product_name || item.name || 'Товар'}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMWY1ZjkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNlMmU3ZWYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5NDk5YTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYW1lcmE8L2x0ZXh0Pjwvc3ZnPg==';
                              }}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{item.product_name || item.name || 'Товар'}</p>
                              <p className="text-sm text-slate-600">Количество: {item.quantity}</p>
                            </div>
                            <p className="font-semibold text-slate-900">
                              {((item.price || 0) * (item.quantity || 1)).toLocaleString('ru-RU')} ₽
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900">Итого:</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {selectedOrder.total?.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    archiveOrderMutation.mutate({
                      orderNumber: selectedOrder.order_number,
                      archived: !selectedOrder.archived,
                    });
                    setIsOrderDialogOpen(false);
                  }}
                  className="text-slate-600"
                >
                  {selectedOrder.archived ? '↩️ Восстановить из архива' : '📦 В архив'}
                </Button>
                <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Компонент управления категориями
function CategoriesManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [selectedCategoryForProducts, setSelectedCategoryForProducts] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [subcategoriesCount, setSubcategoriesCount] = useState(0);
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories/tree`);
      if (!response.ok) throw new Error('Ошибка загрузки категорий');
      return response.json();
    },
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/categories?all=true`);
      if (!response.ok) throw new Error('Ошибка загрузки категорий');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, withChildren = false }) => {
      const url = `${apiUrl}/api/categories/${id}${withChildren ? '?with_children=true' : ''}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(data.message || 'Категория удалена');
      setShowDeleteConfirmDialog(false);
      setCategoryToDelete(null);
      setSubcategoriesCount(0);
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка удаления категории');
    },
  });

  // Функция для обработки удаления категории
  const handleDeleteCategory = (category) => {
    // Проверяем, есть ли подкатегории
    const subcategories = getSubcategories(category.id);
    const subcategoriesCount = subcategories.length;
    
    if (subcategoriesCount > 0) {
      // Показываем диалог подтверждения
      setCategoryToDelete(category);
      setSubcategoriesCount(subcategoriesCount);
      setShowDeleteConfirmDialog(true);
    } else {
      // Если подкатегорий нет, удаляем сразу
      if (confirm(`Удалить категорию "${category.name}"?`)) {
        deleteMutation.mutate({ id: category.id, withChildren: false });
      }
    }
  };

  // Функция для подтверждения удаления с подкатегориями
  const handleConfirmDeleteWithChildren = () => {
    if (categoryToDelete) {
      deleteMutation.mutate({ id: categoryToDelete.id, withChildren: true });
    }
  };

  // Получение товаров категории
  const { data: categoryProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['category-products', selectedCategoryForProducts?.id],
    queryFn: async () => {
      if (!selectedCategoryForProducts?.id) return [];
      const response = await fetch(`${apiUrl}/api/categories/${selectedCategoryForProducts.id}/products`);
      if (!response.ok) throw new Error('Ошибка загрузки товаров');
      return response.json();
    },
    enabled: !!selectedCategoryForProducts?.id && showProductsDialog,
  });

  // Перенос товаров в другую категорию
  const moveProductsMutation = useMutation({
    mutationFn: async ({ categoryId, targetCategoryId, clearSubcategory, clearSubsubcategory }) => {
      const response = await fetch(`${apiUrl}/api/categories/${categoryId}/move-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          target_category_id: targetCategoryId || null,
          clear_subcategory: clearSubcategory,
          clear_subsubcategory: clearSubsubcategory 
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка переноса товаров');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['category-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(data.message || 'Товары успешно перенесены');
      setShowProductsDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка переноса товаров');
    },
  });

  // Функция для рекурсивного поиска родительских категорий
  const findCategoryById = (id) => categories.find(c => c.id === id);
  
  const matchesSearchQuery = (category) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = category.name?.toLowerCase().includes(query);
    const prefixMatch = category.product_name_prefix?.toLowerCase().includes(query);
    return nameMatch || prefixMatch;
  };
  
  // Функция для проверки, соответствует ли категория или её родители поисковому запросу
  const categoryMatchesSearch = (category) => {
    if (!searchQuery.trim()) return true;
    
    // Проверяем саму категорию
    if (matchesSearchQuery(category)) {
      return true;
    }
    
    // Рекурсивно проверяем всех родителей
    let currentParentId = category.parent_id;
    while (currentParentId) {
      const parent = findCategoryById(currentParentId);
      if (!parent) break;
      if (matchesSearchQuery(parent)) {
        return true;
      }
      currentParentId = parent.parent_id;
    }
    
    return false;
  };

  // Фильтрация категорий по поисковому запросу
  const filteredCategories = categories.filter((category) => categoryMatchesSearch(category));

  const topLevelCategories = filteredCategories.filter(c => c.level === 0);
  const getSubcategories = (parentId) => filteredCategories.filter(c => c.parent_id === parentId);

  const renderCategoryItem = (category, depth = 0) => {
    const subcategories = getSubcategories(category.id);
    
    return (
      <div key={category.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3" style={{ paddingLeft: `${Math.min(depth * 24, 48)}px` }}>
            <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 text-sm sm:text-base">{category.name}</p>
              <p className="text-xs text-slate-500">
                Уровень {category.level} {category.parent_id ? `(родитель: ${categories.find(c => c.id === category.parent_id)?.name || category.parent_id})` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCategory(category);
                setSelectedParent(category.parent_id);
                setShowForm(true);
              }}
              className="text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              Редактировать
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCategory(null);
                setSelectedParent(category.id);
                setShowForm(true);
              }}
              className="text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              + Подкатегория
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedCategoryForProducts(category);
                setShowProductsDialog(true);
              }}
              className="text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              Товары
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteCategory(category)}
              className="text-xs sm:text-sm flex-1 sm:flex-initial"
            >
              Удалить
            </Button>
          </div>
        </div>
        {subcategories.length > 0 && (
          <div className="mt-2 ml-6">
            {subcategories.map(subcat => renderCategoryItem(subcat, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Управление категориями</h2>
        <Button onClick={() => { setShowForm(true); setEditingCategory(null); setSelectedParent(null); }} className="w-full sm:w-auto">
          + Добавить категорию
        </Button>
      </div>

      {/* Поиск */}
      <div className="bg-white rounded-lg shadow p-4">
        <Input
          type="text"
          placeholder="Поиск по названию категории или префиксу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        {searchQuery && (
          <p className="text-sm text-slate-500 mt-2">
            Найдено категорий: {filteredCategories.length}
          </p>
        )}
      </div>

      {showForm && (
        <CategoryFormDialog
          category={editingCategory}
          parentId={selectedParent}
          allCategories={allCategories}
          onClose={() => { setShowForm(false); setEditingCategory(null); setSelectedParent(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategory(null);
            setSelectedParent(null);
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            queryClient.invalidateQueries({ queryKey: ['all-categories'] });
          }}
        />
      )}

      {isLoading ? (
        <div>Загрузка...</div>
      ) : topLevelCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">Категории не найдены</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topLevelCategories.map(category => renderCategoryItem(category))}
        </div>
      )}

      {/* Модальное окно для просмотра и переноса товаров */}
      {showProductsDialog && selectedCategoryForProducts && (
        <CategoryProductsDialog
          category={selectedCategoryForProducts}
          products={categoryProducts}
          isLoadingProducts={isLoadingProducts}
          allCategories={allCategories}
          onMoveProducts={moveProductsMutation}
          onClose={() => {
            setShowProductsDialog(false);
            setSelectedCategoryForProducts(null);
          }}
        />
      )}

      {/* Диалог подтверждения удаления категории с подкатегориями */}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удаление категории с подкатегориями</AlertDialogTitle>
            <AlertDialogDescription>
              Категория "{categoryToDelete?.name}" имеет {subcategoriesCount} {subcategoriesCount === 1 ? 'подкатегорию' : subcategoriesCount < 5 ? 'подкатегории' : 'подкатегорий'}.
              <br /><br />
              Вы уверены, что хотите удалить категорию и все её подкатегории? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteConfirmDialog(false);
              setCategoryToDelete(null);
              setSubcategoriesCount(0);
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDeleteWithChildren}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить все
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Модальное окно для просмотра и переноса товаров категории
function CategoryProductsDialog({ category, products, isLoadingProducts, allCategories, onMoveProducts, onClose }) {
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const categoryLevel = category?.level || 0;

  const handleMoveProducts = () => {
    if ((!targetCategoryId || targetCategoryId === 'none') && categoryLevel === 0) {
      toast.error('Выберите целевую категорию');
      return;
    }

    const confirmMessage = categoryLevel === 0
      ? `Перенести все товары из категории "${category.name}" в выбранную категорию?`
      : `Отвязать все товары от ${categoryLevel === 1 ? 'подкатегории' : 'под-подкатегории'} "${category.name}"?`;
    
    if (confirm(confirmMessage)) {
      onMoveProducts.mutate({
        categoryId: category.id,
        targetCategoryId: (targetCategoryId && targetCategoryId !== 'none') ? targetCategoryId : null,
        clearSubcategory: categoryLevel >= 1,
        clearSubsubcategory: categoryLevel >= 2,
      });
    }
  };

  // Фильтруем категории для выбора целевой (только основные категории для уровня 0)
  const availableTargetCategories = allCategories.filter(c => {
    if (categoryLevel === 0) {
      return c.level === 0 && c.id !== category.id;
    }
    return c.level === 0; // Для подкатегорий можно выбрать любую основную категорию
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Товары категории "{category.name}"</DialogTitle>
          <DialogDescription>
            {products.length > 0 
              ? `Найдено товаров: ${products.length}` 
              : 'Товары не найдены'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoadingProducts ? (
            <div className="text-center py-8">Загрузка товаров...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              В этой категории нет товаров
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{product.name}</p>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                      <span>ID: {product.id}</span>
                      {product.category_name && <span>Категория: {product.category_name}</span>}
                      {product.subcategory_name && <span>Подкатегория: {product.subcategory_name}</span>}
                      {product.subsubcategory_name && <span>Под-подкатегория: {product.subsubcategory_name}</span>}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 ml-4">{product.price} ₽</p>
                </div>
              ))}
            </div>
          )}

          {/* Форма переноса товаров */}
          {products.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <Label>
                  {categoryLevel === 0 
                    ? 'Перенести все товары в категорию:' 
                    : categoryLevel === 1
                    ? 'Перенести все товары в основную категорию (очистить подкатегорию):'
                    : 'Очистить под-подкатегорию (оставить только основную и подкатегорию):'}
                </Label>
                {categoryLevel === 0 ? (
                  <Select
                    value={targetCategoryId}
                    onValueChange={setTargetCategoryId}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Выберите целевую категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargetCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={targetCategoryId}
                    onValueChange={setTargetCategoryId}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Выберите основную категорию (опционально)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Оставить текущую</SelectItem>
                      {availableTargetCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {categoryLevel === 0 
                    ? 'Все товары будут перенесены в выбранную категорию'
                    : categoryLevel === 1
                    ? 'У всех товаров будет очищена подкатегория и под-подкатегория'
                    : 'У всех товаров будет очищена под-подкатегория'}
                </p>
              </div>

              <Button
                onClick={handleMoveProducts}
                disabled={onMoveProducts.isPending || (categoryLevel === 0 && !targetCategoryId)}
                variant="default"
                className="w-full"
              >
                {onMoveProducts.isPending 
                  ? 'Перенос...' 
                  : categoryLevel === 0
                  ? 'Перенести все товары'
                  : 'Очистить привязки товаров'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Модальное окно для формы создания/редактирования категории
function CategoryFormDialog({ category, parentId, allCategories, onClose, onSuccess }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Редактировать категорию' : 'Добавить категорию'}
          </DialogTitle>
          <DialogDescription>
            {category ? 'Измените данные категории' : 'Заполните форму для создания новой категории'}
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          category={category}
          parentId={parentId}
          allCategories={allCategories}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

// Форма создания/редактирования категории
function CategoryForm({ category, parentId, allCategories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    parent_id: category?.parent_id || parentId || null,
    level: category?.level !== undefined ? category.level : (parentId ? 1 : 0),
    product_name_prefix: category?.product_name_prefix || '',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Обновляем formData когда category изменяется
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        parent_id: category.parent_id || parentId || null,
        level: category.level !== undefined ? category.level : (parentId ? 1 : 0),
        product_name_prefix: category.product_name_prefix || '',
      });
    } else {
      setFormData({
        name: '',
        parent_id: parentId || null,
        level: parentId ? 1 : 0,
        product_name_prefix: '',
      });
    }
  }, [category, parentId]);

  useEffect(() => {
    if (formData.parent_id) {
      const parent = allCategories.find(c => c.id === formData.parent_id);
      if (parent) {
        setFormData(prev => ({ ...prev, level: (parent.level || 0) + 1 }));
      }
    } else {
      setFormData(prev => ({ ...prev, level: 0 }));
    }
  }, [formData.parent_id, allCategories]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const url = category
        ? `${apiUrl}/api/categories/${category.id}`
        : `${apiUrl}/api/categories`;
      const method = category ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Ошибка сохранения');
      return response.json();
    },
    onSuccess: () => {
      toast.success(category ? 'Категория обновлена' : 'Категория создана');
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const availableParents = allCategories.filter(c => {
    if (category && c.id === category.id) return false;
    if (category && c.level >= (category.level || 0)) return false;
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <Label>Название категории</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Например: Фотоаппараты"
          />
        </div>

        <div>
          <Label>Родительская категория (опционально)</Label>
          <Select
            value={formData.parent_id?.toString() || 'none'}
            onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? null : parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите родительскую категорию (для подкатегории)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Нет (основная категория)</SelectItem>
              {availableParents.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {'  '.repeat(cat.level || 0)}{cat.name} (уровень {cat.level || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500 mt-1">
            Уровень будет автоматически определен: {formData.level}
          </p>
        </div>

        <div>
          <Label>Префикс названия товара (опционально)</Label>
          <Input
            value={formData.product_name_prefix}
            onChange={(e) => setFormData({ ...formData, product_name_prefix: e.target.value })}
            placeholder="Например: Фотоаппарат или Объектив"
          />
          <p className="text-xs text-slate-500 mt-1">
            Если указан, товары из этой категории будут отображаться как "{formData.product_name_prefix || '[префикс]'} [название товара]"
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
  );
}

// Компонент управления брендами
function BrandsManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/brands`);
      if (!response.ok) throw new Error('Ошибка загрузки брендов');
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${apiUrl}/api/brands/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Бренд удален');
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка удаления бренда');
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Управление брендами</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={async () => {
              try {
                const response = await fetch(`${apiUrl}/api/products/brands`);
                if (!response.ok) throw new Error('Ошибка загрузки брендов из товаров');
                const productBrands = await response.json();
                
                // Создаем бренды из товаров, которых нет в таблице brands
                const existingBrandNames = brands.map(b => b.name.toLowerCase());
                const newBrands = productBrands.filter(b => !existingBrandNames.includes(b.toLowerCase()));
                
                for (const brandName of newBrands) {
                  await fetch(`${apiUrl}/api/brands`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: brandName }),
                  });
                }
                
                queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
                queryClient.invalidateQueries({ queryKey: ['brands'] });
                toast.success(`Добавлено ${newBrands.length} брендов из товаров`);
              } catch (error) {
                toast.error(error.message || 'Ошибка синхронизации брендов');
              }
            }}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Синхронизировать из товаров
          </Button>
          <Button onClick={() => { setShowForm(true); setEditingBrand(null); }} className="w-full sm:w-auto">
            + Добавить бренд
          </Button>
        </div>
      </div>

      {showForm && (
        <BrandForm
          brand={editingBrand}
          onClose={() => { setShowForm(false); setEditingBrand(null); }}
          onSuccess={() => {
            setShowForm(false);
            setEditingBrand(null);
            queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
            queryClient.invalidateQueries({ queryKey: ['brands'] });
          }}
        />
      )}

      {isLoading ? (
        <div>Загрузка...</div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">Бренды не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* На мобильных - карточки, на десктопе - таблица */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">ID</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Название</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Популярный</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Позиция</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="px-3 sm:px-4 py-3 text-sm">{brand.id}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm font-medium">{brand.name}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm">
                      {brand.popular ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Да
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Нет
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm">{brand.sort_order || '-'}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingBrand(brand); setShowForm(true); }}
                          className="text-xs sm:text-sm"
                        >
                          Редактировать
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Удалить бренд "${brand.name}"?`)) {
                              deleteMutation.mutate(brand.id);
                            }
                          }}
                          className="text-xs sm:text-sm"
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Мобильный вид - карточки для брендов */}
          <div className="md:hidden divide-y">
            {brands.map((brand) => (
              <div key={brand.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">{brand.name}</p>
                    <p className="text-xs text-slate-500">ID: {brand.id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        brand.popular 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {brand.popular ? 'Популярный' : 'Обычный'}
                      </span>
                      {brand.sort_order && (
                        <span className="text-xs text-slate-500">Позиция: {brand.sort_order}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditingBrand(brand); setShowForm(true); }}
                    className="flex-1 text-sm"
                  >
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Удалить бренд "${brand.name}"?`)) {
                        deleteMutation.mutate(brand.id);
                      }
                    }}
                    className="flex-1 text-sm"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Форма создания/редактирования бренда
function BrandForm({ brand, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: brand?.name || '',
    popular: brand?.popular || false,
    sort_order: brand?.sort_order || 0,
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const url = brand
        ? `${apiUrl}/api/brands/${brand.id}`
        : `${apiUrl}/api/brands`;
      const method = brand ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(brand ? 'Бренд обновлен' : 'Бренд создан');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка сохранения бренда');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold mb-4">
        {brand ? 'Редактировать бренд' : 'Добавить бренд'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Название бренда</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Например: Canon"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="popular"
            checked={formData.popular}
            onCheckedChange={(checked) => setFormData({ ...formData, popular: checked === true })}
          />
          <Label
            htmlFor="popular"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Популярный бренд
          </Label>
        </div>

        <div>
          <Label htmlFor="sort_order">Позиция в списке (0 = по алфавиту, больше = выше)</Label>
          <Input
            id="sort_order"
            type="number"
            min="0"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
          <p className="text-xs text-slate-500 mt-1">
            Бренды с позицией &gt; 0 отображаются первыми, по возрастанию позиции. Остальные — по алфавиту.
          </p>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}

// Компонент управления чатами
function ChatsManager() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/chats`);
      if (!response.ok) throw new Error('Ошибка загрузки чатов');
      return response.json();
    },
    refetchInterval: 3000,
  });

  const { data: currentChat, refetch: refetchChat } = useQuery({
    queryKey: ['chat', selectedChat],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/chats/${selectedChat}`);
      if (!response.ok) throw new Error('Ошибка загрузки чата');
      return response.json();
    },
    enabled: !!selectedChat,
    refetchInterval: selectedChat ? 2000 : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      const response = await fetch(`${apiUrl}/api/chats/${selectedChat}/messages/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, admin_id: 1 }),
      });
      if (!response.ok) throw new Error('Ошибка отправки сообщения');
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      refetchChat();
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${apiUrl}/api/chats/${selectedChat}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Ошибка обновления статуса');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      refetchChat();
    },
  });

  useEffect(() => {
    if (selectedChat && currentChat) {
      const unreadMessages = currentChat.messages?.filter(
        (m) => m.sender === 'user' && !m.is_read
      );
      if (unreadMessages && unreadMessages.length > 0) {
        markAsReadMutation.mutate();
      }
    }
  }, [selectedChat, currentChat]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleChatSelect = (chatId) => {
    setSelectedChat(chatId);
    setMessageText('');
  };

  if (chatsLoading) {
    return <div className="text-center py-8 text-slate-600">Загрузка чатов...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900">Онлайн-чаты</h2>
        <p className="text-sm text-slate-500 mt-1">Общайтесь с пользователями в реальном времени</p>
      </div>

      <div className="flex h-[calc(100vh-300px)] min-h-[600px]">
        <div className="w-80 border-r border-slate-200 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>Нет активных чатов</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {chats.map((chat) => {
                const unreadCount = chat.unread_count || 0;
                const lastMessageTime = chat.last_message_at
                  ? new Date(chat.last_message_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
                  <button
                    key={chat.id}
                    onClick={() => handleChatSelect(chat.id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      selectedChat === chat.id ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {chat.user_name || 'Пользователь'}
                        </p>
                        {chat.user_email && (
                          <p className="text-xs text-slate-500 truncate">{chat.user_email}</p>
                        )}
                        {chat.user_phone && (
                          <p className="text-xs text-slate-500">{chat.user_phone}</p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-emerald-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {lastMessageTime && <p className="text-xs text-slate-400">{lastMessageTime}</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat && currentChat ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentChat.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.sender === 'admin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender === 'admin' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-200 flex-shrink-0"
              >
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !messageText.trim()}
                    className="bg-slate-900 hover:bg-slate-800"
                  >
                    {sendMessageMutation.isPending ? 'Отправка...' : 'Отправить'}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p>Выберите чат для общения</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент управления заблокированными IP
function BlockedIPsManager() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const queryClient = useQueryClient();
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');

  const { data: blockedIPs = [], isLoading } = useQuery({
    queryKey: ['blocked-ips'],
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/api/blocked-ips`);
      if (!response.ok) throw new Error('Ошибка загрузки заблокированных IP');
      return response.json();
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`${apiUrl}/api/blocked-ips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка блокировки IP');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP заблокирован');
      setNewIP('');
      setNewReason('');
    },
    onError: (error) => {
      toast.error(error.message || 'Ошибка блокировки IP');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`${apiUrl}/api/blocked-ips/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Ошибка разблокировки IP');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
      toast.success('IP разблокирован');
    },
  });

  const handleBlock = (e) => {
    e.preventDefault();
    if (!newIP.trim()) {
      toast.error('Введите IP адрес');
      return;
    }
    blockMutation.mutate({
      ip_address: newIP.trim(),
      reason: newReason.trim() || null,
      blocked_by: 'admin',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Управление заблокированными IP</h2>

      {/* Форма блокировки IP */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Заблокировать IP</h3>
        <form onSubmit={handleBlock} className="space-y-4">
          <div>
            <Label>IP адрес</Label>
            <Input
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="192.168.1.1"
              required
            />
          </div>
          <div>
            <Label>Причина блокировки (опционально)</Label>
            <Textarea
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Причина блокировки..."
              rows={3}
            />
          </div>
          <Button type="submit" disabled={blockMutation.isPending}>
            {blockMutation.isPending ? 'Блокировка...' : 'Заблокировать IP'}
          </Button>
        </form>
      </div>

      {/* Список заблокированных IP */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-semibold text-slate-900 p-4 sm:p-6 border-b">Заблокированные IP адреса</h3>
        {isLoading ? (
          <div className="p-4 sm:p-6">Загрузка...</div>
        ) : blockedIPs.length === 0 ? (
          <div className="p-4 sm:p-6 text-slate-500">Нет заблокированных IP адресов</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">IP адрес</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Причина</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Дата блокировки</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {blockedIPs.map((blockedIP) => (
                  <tr key={blockedIP.id}>
                    <td className="px-4 py-3 text-sm font-mono">{blockedIP.ip_address}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {blockedIP.reason || 'Не указана'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(blockedIP.blocked_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unblockMutation.mutate(blockedIP.id)}
                        disabled={unblockMutation.isPending}
                      >
                        Разблокировать
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

