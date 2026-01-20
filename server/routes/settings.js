import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Получить все настройки
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY key');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(settings);
  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({ error: 'Ошибка получения настроек' });
  }
});

// Получить настройку по ключу
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения настройки:', error);
    res.status(500).json({ error: 'Ошибка получения настройки' });
  }
});

// Обновить настройку
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Значение обязательно' });
    }
    
    const result = await pool.query(
      'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2 RETURNING *',
      [value, key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Настройка не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления настройки:', error);
    res.status(500).json({ error: 'Ошибка обновления настройки' });
  }
});

export default router;

