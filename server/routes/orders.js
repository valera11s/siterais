import express from 'express';
import { pool } from '../index.js';
import { notifyNewOrder } from '../utils/telegram.js';
import { validateEmail, validateName, validatePhone, validateNumber, validateString, getClientIP } from '../utils/validation.js';

const router = express.Router();

// Middleware для проверки заблокированных IP (только для создания заказов)
async function checkBlockedIP(req, res, next) {
  try {
    const clientIP = getClientIP(req);
    if (clientIP === 'unknown') {
      return next(); // Если IP не определён, пропускаем
    }
    
    const result = await pool.query(
      'SELECT id FROM blocked_ips WHERE ip_address = $1',
      [clientIP]
    );
    
    if (result.rows.length > 0) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    next();
  } catch (error) {
    console.error('Ошибка проверки заблокированных IP:', error);
    next(); // При ошибке пропускаем, чтобы не блокировать работу
  }
}

// Получить все заказы
router.get('/', async (req, res) => {
  try {
    const { status, archived } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (archived !== undefined) {
      query += ` AND archived = $${paramIndex}`;
      params.push(archived === 'true');
      paramIndex++;
    } else {
      // По умолчанию показываем только активные заказы
      query += ` AND archived = $${paramIndex}`;
      params.push(false);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Получить заказ по номеру
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_number = $1',
      [orderNumber]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
});

// Создать заказ
router.post('/', checkBlockedIP, async (req, res) => {
  try {
    const {
      order_number, items, total, customer_email, customer_name,
      shipping_address, payment_method
    } = req.body;

    // Валидация входных данных
    if (customer_email) {
      const emailValidation = validateEmail(customer_email);
      if (!emailValidation.valid) {
        console.error('Ошибка валидации email:', customer_email, emailValidation.error);
        return res.status(400).json({ error: emailValidation.error });
      }
    }

    if (customer_name) {
      const nameValidation = validateName(customer_name);
      if (!nameValidation.valid) {
        console.error('Ошибка валидации имени:', customer_name, nameValidation.error);
        return res.status(400).json({ error: nameValidation.error });
      }
    }

    if (shipping_address?.phone) {
      const phoneValidation = validatePhone(shipping_address.phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error });
      }
    }

    if (shipping_address?.address) {
      const addressValidation = validateString(shipping_address.address, 'Адрес', 0, 500, true);
      if (!addressValidation.valid) {
        return res.status(400).json({ error: addressValidation.error });
      }
    }

    if (shipping_address?.city) {
      const cityValidation = validateString(shipping_address.city, 'Город', 0, 100, true);
      if (!cityValidation.valid) {
        return res.status(400).json({ error: cityValidation.error });
      }
    }

    const totalValidation = validateNumber(total, 0);
    if (!totalValidation.valid) {
      return res.status(400).json({ error: totalValidation.error });
    }

    const clientIP = getClientIP(req);
    
    // Логирование для отладки (можно убрать после проверки)
    console.log('📡 Client IP detection:', {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'cf-connecting-ip': req.headers['cf-connecting-ip'],
      'req.ip': req.ip,
      'connection.remoteAddress': req.connection?.remoteAddress,
      'socket.remoteAddress': req.socket?.remoteAddress,
      'detected_ip': clientIP
    });

    const result = await pool.query(
      `INSERT INTO orders (
        order_number, items, total, customer_email, customer_name,
        shipping_address, payment_method, status, client_ip
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
      RETURNING *`,
      [
        order_number,
        JSON.stringify(items),
        totalValidation.value,
        customer_email || null,
        customer_name || null,
        JSON.stringify(shipping_address || {}),
        payment_method || null,
        clientIP !== 'unknown' ? clientIP : null
      ]
    );

    const order = result.rows[0];
    
    // Отправляем уведомление в Telegram о новом заказе
    try {
      await notifyNewOrder(order);
    } catch (error) {
      console.error('Ошибка отправки уведомления о заказе в Telegram:', error);
      // Не прерываем создание заказа из-за ошибки уведомления
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// Обновить статус заказа
router.patch('/:orderNumber/status', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'assembling', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_number = $2 RETURNING *',
      [status, orderNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

// Перенести заказ в архив/из архива
router.patch('/:orderNumber/archive', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { archived } = req.body;

    if (typeof archived !== 'boolean') {
      return res.status(400).json({ error: 'Параметр archived должен быть boolean' });
    }

    const result = await pool.query(
      'UPDATE orders SET archived = $1, updated_at = CURRENT_TIMESTAMP WHERE order_number = $2 RETURNING *',
      [archived, orderNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления архива:', error);
    res.status(500).json({ error: 'Ошибка обновления архива' });
  }
});

export default router;



