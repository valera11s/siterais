import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Получить все бренды (сначала по sort_order по возрастанию, потом остальные по алфавиту)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM brands 
      ORDER BY 
        CASE WHEN sort_order > 0 THEN 0 ELSE 1 END,
        sort_order ASC NULLS LAST,
        name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения брендов:', error);
    res.status(500).json({ error: 'Ошибка получения брендов' });
  }
});

// Получить бренд по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM brands WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бренд не найден' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения бренда:', error);
    res.status(500).json({ error: 'Ошибка получения бренда' });
  }
});

// Создать бренд
router.post('/', async (req, res) => {
  try {
    const { name, popular = false, sort_order = 0 } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Название бренда обязательно' });
    }
    
    const result = await pool.query(
      `INSERT INTO brands (name, popular, sort_order) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, popular = EXCLUDED.popular, sort_order = EXCLUDED.sort_order 
       RETURNING *`,
      [name.trim(), Boolean(popular), parseInt(sort_order) || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(400).json({ error: 'Бренд с таким названием уже существует' });
    }
    console.error('Ошибка создания бренда:', error);
    res.status(500).json({ error: 'Ошибка создания бренда' });
  }
});

// Обновить бренд
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, popular, sort_order } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Название бренда обязательно' });
    }
    
    const result = await pool.query(
      `UPDATE brands 
       SET name = $1, 
           popular = COALESCE($2, popular), 
           sort_order = COALESCE($3, sort_order) 
       WHERE id = $4 
       RETURNING *`,
      [name.trim(), popular !== undefined ? Boolean(popular) : null, sort_order !== undefined ? (parseInt(sort_order) || 0) : null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бренд не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Бренд с таким названием уже существует' });
    }
    console.error('Ошибка обновления бренда:', error);
    res.status(500).json({ error: 'Ошибка обновления бренда' });
  }
});

// Удалить бренд
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, используется ли бренд в товарах
    const productsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE brand = (SELECT name FROM brands WHERE id = $1)',
      [id]
    );
    
    if (parseInt(productsCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Бренд используется в товарах и не может быть удален' });
    }
    
    const result = await pool.query('DELETE FROM brands WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Бренд не найден' });
    }
    
    res.json({ message: 'Бренд удален', brand: result.rows[0] });
  } catch (error) {
    console.error('Ошибка удаления бренда:', error);
    res.status(500).json({ error: 'Ошибка удаления бренда' });
  }
});

export default router;


