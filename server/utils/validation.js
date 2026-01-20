/**
 * Утилиты для валидации входных данных и защиты от SQL инъекций
 */

// Проверка на SQL инъекции - опасные символы
const SQL_INJECTION_PATTERNS = [
  /([';\\]|(--)|(\/\*)|(\*\/)|(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b))/gi,
  /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/gi, // OR 1=1, AND 1=1
  /['"]\s*;\s*(drop|delete|update|insert)/gi,
];

/**
 * Проверяет строку на наличие потенциальных SQL инъекций
 */
export function hasSQLInjection(str) {
  if (!str || typeof str !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Валидация email
 */
export function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email обязателен' };
  if (typeof email !== 'string') return { valid: false, error: 'Email должен быть строкой' };
  if (email.length > 255) return { valid: false, error: 'Email слишком длинный' };
  if (hasSQLInjection(email)) return { valid: false, error: 'Недопустимые символы в email' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Неверный формат email' };
  
  return { valid: true };
}

/**
 * Валидация имени/ФИО (только буквы, пробелы, дефисы)
 */
export function validateName(name) {
  if (!name) return { valid: false, error: 'Имя обязательно' };
  if (typeof name !== 'string') return { valid: false, error: 'Имя должно быть строкой' };
  if (name.length > 255) return { valid: false, error: 'Имя слишком длинное' };
  if (hasSQLInjection(name)) return { valid: false, error: 'Недопустимые символы в имени' };
  
  // Только буквы, пробелы, дефисы, апострофы (для имен типа O'Brien)
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/u;
  if (!nameRegex.test(name)) return { valid: false, error: 'Имя может содержать только буквы, пробелы и дефисы' };
  
  return { valid: true };
}

/**
 * Валидация телефона
 */
export function validatePhone(phone) {
  if (!phone) return { valid: false, error: 'Телефон обязателен' };
  if (typeof phone !== 'string') return { valid: false, error: 'Телефон должен быть строкой' };
  if (phone.length > 50) return { valid: false, error: 'Телефон слишком длинный' };
  if (hasSQLInjection(phone)) return { valid: false, error: 'Недопустимые символы в телефоне' };
  
  // Разрешаем цифры, пробелы, скобки, дефисы, плюс
  const phoneRegex = /^[\d\s\(\)\-\+]+$/;
  if (!phoneRegex.test(phone)) return { valid: false, error: 'Телефон может содержать только цифры и знаки форматирования' };
  
  return { valid: true };
}

/**
 * Валидация поискового запроса
 */
export function validateSearchQuery(query) {
  if (!query) return { valid: true }; // Пустой запрос допустим
  if (typeof query !== 'string') return { valid: false, error: 'Запрос должен быть строкой' };
  if (query.length > 500) return { valid: false, error: 'Запрос слишком длинный' };
  if (hasSQLInjection(query)) return { valid: false, error: 'Недопустимые символы в запросе' };
  
  return { valid: true };
}

/**
 * Валидация ID (число)
 */
export function validateId(id) {
  if (!id) return { valid: false, error: 'ID обязателен' };
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    return { valid: false, error: 'ID должен быть положительным целым числом' };
  }
  return { valid: true, value: numId };
}

/**
 * Валидация числа/цены
 */
export function validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Число обязательно' };
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return { valid: false, error: 'Неверный формат числа' };
  if (num < min) return { valid: false, error: `Число должно быть не меньше ${min}` };
  if (num > max) return { valid: false, error: `Число должно быть не больше ${max}` };
  return { valid: true, value: num };
}

/**
 * Валидация строки с ограничением длины
 */
export function validateString(str, fieldName = 'Поле', minLength = 0, maxLength = 1000, allowEmpty = true) {
  if (!str && !allowEmpty) return { valid: false, error: `${fieldName} обязательно` };
  if (!str && allowEmpty) return { valid: true };
  if (typeof str !== 'string') return { valid: false, error: `${fieldName} должен быть строкой` };
  if (str.length < minLength) return { valid: false, error: `${fieldName} слишком короткий (минимум ${minLength} символов)` };
  if (str.length > maxLength) return { valid: false, error: `${fieldName} слишком длинный (максимум ${maxLength} символов)` };
  if (hasSQLInjection(str)) return { valid: false, error: `Недопустимые символы в ${fieldName}` };
  return { valid: true };
}

/**
 * Валидация IP адреса
 */
export function validateIP(ip) {
  if (!ip) return { valid: false, error: 'IP адрес обязателен' };
  if (typeof ip !== 'string') return { valid: false, error: 'IP адрес должен быть строкой' };
  if (hasSQLInjection(ip)) return { valid: false, error: 'Недопустимые символы в IP адресе' };
  
  // Простая проверка формата IP (IPv4)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return { valid: false, error: 'Неверный формат IP адреса' };
  
  // Проверка диапазона каждого октета
  const parts = ip.split('.');
  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0 || num > 255) {
      return { valid: false, error: 'Неверный формат IP адреса' };
    }
  }
  
  return { valid: true };
}

/**
 * Получить IP адрес из запроса
 * Проверяет различные заголовки и свойства запроса для определения реального IP клиента
 */
export function getClientIP(req) {
  // Проверяем заголовки прокси/CDN (приоритет выше, так как они содержат реальный IP клиента)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for может содержать список IP через запятую (первый - оригинальный клиент)
    const ip = forwardedFor.split(',')[0].trim();
    // Убираем порт, если он есть (IPv6 может быть в формате [::1]:12345)
    return ip.split(':')[0].replace(/^\[|\]$/g, '');
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP.split(':')[0].replace(/^\[|\]$/g, '');
  }

  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.split(':')[0].replace(/^\[|\]$/g, '');
  }

  // Используем стандартное свойство Express (работает с trust proxy)
  if (req.ip) {
    let ip = req.ip.trim();
    if (!ip) return 'unknown';
    
    // Убираем квадратные скобки для IPv6
    ip = ip.replace(/^\[|\]$/g, '');
    
    // Обрабатываем IPv6 localhost (::1) - конвертируем в 127.0.0.1
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    
    // Убираем ::ffff: префикс для IPv4-mapped IPv6 адресов (например ::ffff:192.168.1.1 -> 192.168.1.1)
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7); // Убираем "::ffff:"
    }
    
    // Если это IPv4 (нет двоеточий, кроме ::ffff: который мы уже убрали)
    if (!ip.includes(':')) {
      return ip;
    }
    
    // Если остался IPv6 адрес, возвращаем как есть (но localhost уже обработали выше)
    return ip || 'unknown';
  }

  // Fallback на connection/socket (для прямых подключений)
  const connectionIP = req.connection?.remoteAddress || req.socket?.remoteAddress;
  if (connectionIP) {
    let ip = String(connectionIP).trim();
    if (!ip) return 'unknown';
    
    // Убираем квадратные скобки
    ip = ip.replace(/^\[|\]$/g, '');
    
    // Обрабатываем IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }
    
    // Убираем ::ffff: префикс
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }
    
    // Если это IPv4
    if (!ip.includes(':')) {
      return ip;
    }
    
    return ip || 'unknown';
  }

  return 'unknown';
}

