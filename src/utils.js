export function createPageUrl(pageName) {
  const pageMap = {
    'Home': '/',
    'Shop': '/shop',
    'Delivery': '/delivery',
    'About': '/about',
    'Contacts': '/contacts',
    'Warranty': '/warranty',
    'ProductDetails': '/product',
    'Checkout': '/checkout',
    'OrderStatus': '/order-status',
  };
  
  return pageMap[pageName] || '/';
}

// Форматирование цены: убираем копейки и разделяем каждые 3 цифры пробелом
export function formatPrice(price) {
  if (!price && price !== 0) return '0';
  // Округляем до целого и форматируем с пробелами
  const rounded = Math.round(Number(price));
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Генерация SEO-friendly slug из строки
export function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Заменяем пробелы на дефисы
    .replace(/[^\w\-]+/g, '')       // Удаляем все не-словесные символы
    .replace(/\-\-+/g, '-')         // Заменяем множественные дефисы на один
    .replace(/^-+/, '')             // Удаляем дефисы в начале
    .replace(/-+$/, '');            // Удаляем дефисы в конце
}

// Создание URL товара с slug
export function createProductUrl(product) {
  if (product.slug) {
    return `${createPageUrl('ProductDetails')}/${product.slug}`;
  }
  // Если slug нет, создаем его из названия и ID
  const slug = generateSlug(product.name || 'product');
  const id = product.id || '';
  return `${createPageUrl('ProductDetails')}/${slug}-${id}`;
}


