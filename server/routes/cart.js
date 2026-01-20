import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Получить корзину по session_id
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await pool.query(
      `SELECT ci.*, p.name, p.price, p.image_url 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.session_id = $1`,
      [sessionId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({ error: 'Ошибка получения корзины' });
  }
});

// Добавить товар в корзину
router.post('/', async (req, res) => {
  try {
    const { session_id, product_id, quantity } = req.body;

    // Проверяем, есть ли уже такой товар в корзине
    const existing = await pool.query(
      'SELECT * FROM cart_items WHERE session_id = $1 AND product_id = $2',
      [session_id, product_id]
    );

    if (existing.rows.length > 0) {
      // Обновляем количество
      const result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
        [quantity || 1, existing.rows[0].id]
      );
      return res.json(result.rows[0]);
    }

    // Создаем новую запись
    const result = await pool.query(
      'INSERT INTO cart_items (session_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [session_id, product_id, quantity || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ error: 'Ошибка добавления в корзину' });
  }
});

// Обновить количество товара в корзине
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар в корзине не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
    res.status(500).json({ error: 'Ошибка обновления корзины' });
  }
});

// Удалить товар из корзины
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cart_items WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар в корзине не найден' });
    }
    
    res.json({ message: 'Товар удален из корзины', id: result.rows[0].id });
  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
});

export default router;



