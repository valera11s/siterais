// Защита от DDoS атак
// Блокирует IP адреса, которые делают более 200 запросов за минуту

import { pool } from '../index.js';

// Хранилище запросов в памяти (ключ - IP, значение - массив временных меток)
const requestStore = new Map();

// Очистка старых запросов (запускается каждые 10 секунд для более точного подсчета)
setInterval(() => {
  const oneMinuteAgo = Date.now() - (60 * 1000);
  for (const [ip, timestamps] of requestStore.entries()) {
    const filtered = timestamps.filter(timestamp => timestamp > oneMinuteAgo);
    if (filtered.length === 0) {
      requestStore.delete(ip);
    } else {
      requestStore.set(ip, filtered);
    }
  }
}, 10000); // Каждые 10 секунд для более точного подсчета

// Проверка, заблокирован ли IP
async function isIPBlocked(ip) {
  try {
    const result = await pool.query(
      'SELECT id FROM blocked_ips WHERE ip_address = $1',
      [ip]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Ошибка проверки блокировки IP:', error);
    return false;
  }
}

// Блокировка IP
async function blockIP(ip, reason = 'DDoS атака (более 200 запросов за минуту)') {
  try {
    // Проверяем, не заблокирован ли уже
    const existing = await pool.query(
      'SELECT id FROM blocked_ips WHERE ip_address = $1',
      [ip]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO blocked_ips (ip_address, reason, blocked_by)
         VALUES ($1, $2, $3)`,
        [ip, reason, 'system']
      );
      console.log(`🚫 IP ${ip} заблокирован: ${reason}`);
    }
  } catch (error) {
    console.error('Ошибка блокировки IP:', error);
  }
}

// Middleware для защиты от DDoS
export function ddosProtection(req, res, next) {
  // Получаем IP клиента
  const clientIP = req.ip || 
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.connection?.remoteAddress || 
                   'unknown';

  // Проверяем блокировку
  isIPBlocked(clientIP).then(blocked => {
    if (blocked) {
      return res.status(403).json({ 
        error: 'Доступ запрещен',
        message: 'Ваш IP адрес заблокирован'
      });
    }

    // Получаем текущие запросы для этого IP
    const timestamps = requestStore.get(clientIP) || [];
    const oneMinuteAgo = Date.now() - (60 * 1000);
    const recentRequests = timestamps.filter(timestamp => timestamp > oneMinuteAgo);

    // Добавляем текущий запрос
    recentRequests.push(Date.now());
    requestStore.set(clientIP, recentRequests);

    // Если больше 200 запросов за минуту - блокируем
    if (recentRequests.length > 200) {
      blockIP(clientIP);
      return res.status(429).json({ 
        error: 'Слишком много запросов',
        message: 'Превышен лимит запросов. Ваш IP адрес заблокирован.'
      });
    }

    // Продолжаем выполнение запроса
    next();
  }).catch(error => {
    console.error('Ошибка DDoS защиты:', error);
    // В случае ошибки разрешаем запрос
    next();
  });
}
