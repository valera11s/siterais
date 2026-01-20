import express from 'express';
import { pool } from '../index.js';
import { notifyNewMessage } from '../utils/telegram.js';

const router = express.Router();

// Получить все сообщения
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM messages ORDER BY created_at DESC';
    const params = [];

    if (status) {
      query = 'SELECT * FROM messages WHERE status = $1 ORDER BY created_at DESC';
      params.push(status);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
});

// Получить сообщение по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения сообщения:', error);
    res.status(500).json({ error: 'Ошибка получения сообщения' });
  }
});

// Создать новое сообщение
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    
    // Валидация данных
    const trimmedName = name?.trim();
    const trimmedMessage = message?.trim();
    
    if (!trimmedName || trimmedName.length === 0) {
      return res.status(400).json({ error: 'Имя обязательно для заполнения' });
    }
    
    if (!trimmedMessage || trimmedMessage.length === 0) {
      return res.status(400).json({ error: 'Сообщение обязательно для заполнения' });
    }
    
    const result = await pool.query(
      'INSERT INTO messages (name, phone, email, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [trimmedName, phone?.trim() || null, email?.trim() || null, trimmedMessage]
    );
    
    const newMessage = result.rows[0];
    
    // Отправляем уведомление в Telegram о новом сообщении
    try {
      await notifyNewMessage(newMessage);
    } catch (error) {
      console.error('Ошибка отправки уведомления о сообщении в Telegram:', error);
      // Не прерываем создание сообщения из-за ошибки уведомления
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Ошибка создания сообщения:', error);
    res.status(500).json({ error: 'Ошибка создания сообщения' });
  }
});

// Обновить статус сообщения
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Статус обязателен' });
    }
    
    const result = await pool.query(
      'UPDATE messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления сообщения:', error);
    res.status(500).json({ error: 'Ошибка обновления сообщения' });
  }
});

// Удалить сообщение
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM messages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    
    res.json({ message: 'Сообщение удалено', data: result.rows[0] });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error);
    res.status(500).json({ error: 'Ошибка удаления сообщения' });
  }
});

export default router;

