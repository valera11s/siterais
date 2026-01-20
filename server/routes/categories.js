import express from 'express';
import { pool } from '../index.js';

const router = express.Router();

// Получить все категории
router.get('/', async (req, res) => {
  try {
    const { parent_id, all } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];

    // Если параметр all=true, возвращаем все категории без фильтрации
    if (all === 'true') {
      query += ' ORDER BY level, name';
      const result = await pool.query(query);
      return res.json(result.rows);
    }

    // Иначе фильтруем по parent_id
    if (parent_id !== undefined) {
      if (parent_id === 'null') {
        query += ' WHERE parent_id IS NULL';
      } else {
        query += ' WHERE parent_id = $1';
        params.push(parent_id);
      }
    } else {
      query += ' WHERE parent_id IS NULL';
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

// Получить все категории с иерархией
router.get('/tree', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, parent_id, level, created_at
        FROM categories
        WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.name, c.parent_id, c.level, c.created_at
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree ORDER BY level, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения дерева категорий:', error);
    res.status(500).json({ error: 'Ошибка получения дерева категорий' });
  }
});

// Получить категорию по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({ error: 'Ошибка получения категории' });
  }
});

// Создать категорию
router.post('/', async (req, res) => {
  try {
    const { name, parent_id, level, product_name_prefix } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name, parent_id, level, product_name_prefix) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parent_id || null, level || 0, product_name_prefix || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// Обновить категорию
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, level, product_name_prefix } = req.body;
    
    const result = await pool.query(
      'UPDATE categories SET name = $1, parent_id = $2, level = $3, product_name_prefix = $4 WHERE id = $5 RETURNING *',
      [name, parent_id || null, level || 0, product_name_prefix || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// Получить товары категории
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        p.*,
        c1.name as category_name,
        c1.product_name_prefix as category_product_name_prefix,
        c2.name as subcategory_name,
        c2.product_name_prefix as subcategory_product_name_prefix,
        c3.name as subsubcategory_name,
        c3.product_name_prefix as subsubcategory_product_name_prefix
      FROM products p
      LEFT JOIN categories c1 ON p.category_id = c1.id
      LEFT JOIN categories c2 ON p.subcategory_id = c2.id
      LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
      WHERE p.category_id = $1 OR p.subcategory_id = $1 OR p.subsubcategory_id = $1
      ORDER BY p.name`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения товаров категории:', error);
    res.status(500).json({ error: 'Ошибка получения товаров категории' });
  }
});

// Массовый перенос товаров из одной категории в другую
router.post('/:id/move-products', async (req, res) => {
  try {
    const { id } = req.params;
    // Поддерживаем оба формата: snake_case и camelCase
    const { 
      target_category_id, 
      clear_subcategory, 
      clear_subsubcategory,
      targetCategoryId,
      clearSubcategory,
      clearSubsubcategory
    } = req.body;
    
    // Используем camelCase если snake_case не задан
    const finalTargetCategoryId = target_category_id || targetCategoryId;
    const finalClearSubcategory = clear_subcategory !== undefined ? clear_subcategory : (clearSubcategory !== undefined ? clearSubcategory : false);
    const finalClearSubsubcategory = clear_subsubcategory !== undefined ? clear_subsubcategory : (clearSubsubcategory !== undefined ? clearSubsubcategory : false);
    
    // Определяем, какое поле нужно обновлять на основе уровня категории
    const categoryInfo = await pool.query('SELECT level FROM categories WHERE id = $1', [id]);
    if (categoryInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    const categoryLevel = categoryInfo.rows[0].level;
    let updateQuery;
    let updateParams = [];
    
    if (categoryLevel === 0) {
      // Основная категория - обновляем category_id
      updateQuery = 'UPDATE products SET category_id = $1';
      updateParams = [finalTargetCategoryId];
      if (finalClearSubcategory) {
        updateQuery += ', subcategory_id = NULL';
      }
      if (finalClearSubsubcategory) {
        updateQuery += ', subsubcategory_id = NULL';
      }
      updateQuery += ' WHERE category_id = $2';
      updateParams.push(id);
    } else if (categoryLevel === 1) {
      // Подкатегория - обновляем subcategory_id
      updateQuery = 'UPDATE products SET subcategory_id = $1';
      updateParams = [finalTargetCategoryId || null];
      if (finalClearSubsubcategory) {
        updateQuery += ', subsubcategory_id = NULL';
      }
      updateQuery += ' WHERE subcategory_id = $2';
      updateParams.push(id);
    } else {
      // Под-подкатегория - обновляем subsubcategory_id
      updateQuery = 'UPDATE products SET subsubcategory_id = $1 WHERE subsubcategory_id = $2';
      updateParams = [finalTargetCategoryId || null, id];
    }
    
    const result = await pool.query(updateQuery, updateParams);
    
    res.json({ 
      message: 'Товары успешно перенесены', 
      affected: result.rowCount 
    });
  } catch (error) {
    console.error('Ошибка переноса товаров:', error);
    res.status(500).json({ error: 'Ошибка переноса товаров' });
  }
});

// Рекурсивная функция для удаления категории и всех её дочерних категорий
async function deleteCategoryRecursive(categoryId, pool) {
  // Получаем информацию о категории
  const categoryInfo = await pool.query('SELECT level FROM categories WHERE id = $1', [categoryId]);
  if (categoryInfo.rows.length === 0) return;
  
  const categoryLevel = categoryInfo.rows[0].level;
  
  // Получаем все дочерние категории
  const children = await pool.query(
    'SELECT id FROM categories WHERE parent_id = $1',
    [categoryId]
  );
  
  // Рекурсивно удаляем все дочерние категории
  for (const child of children.rows) {
    await deleteCategoryRecursive(child.id, pool);
  }
  
  // Очищаем привязки товаров в зависимости от уровня категории
  if (categoryLevel === 1) {
    // Подкатегория - очищаем subcategory_id и subsubcategory_id
    await pool.query(
      'UPDATE products SET subcategory_id = NULL, subsubcategory_id = NULL WHERE subcategory_id = $1',
      [categoryId]
    );
  } else if (categoryLevel === 2) {
    // Под-подкатегория - очищаем subsubcategory_id
    await pool.query(
      'UPDATE products SET subsubcategory_id = NULL WHERE subsubcategory_id = $1',
      [categoryId]
    );
  }
  
  // Удаляем саму категорию
  await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
}

// Удалить категорию
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { with_children } = req.query;
    
    // Получаем информацию о категории
    const categoryInfo = await pool.query('SELECT level, name FROM categories WHERE id = $1', [id]);
    if (categoryInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    const categoryLevel = categoryInfo.rows[0].level;
    const categoryName = categoryInfo.rows[0].name;
    
    // Проверяем, используется ли категория в товарах (в зависимости от уровня категории)
    let productsCheckQuery;
    if (categoryLevel === 0) {
      // Основная категория - проверяем только category_id
      productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE category_id = $1';
    } else if (categoryLevel === 1) {
      // Подкатегория - проверяем только subcategory_id
      productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE subcategory_id = $1';
    } else {
      // Под-подкатегория - проверяем только subsubcategory_id
      productsCheckQuery = 'SELECT COUNT(*) as count FROM products WHERE subsubcategory_id = $1';
    }
    
    const productsCheck = await pool.query(productsCheckQuery, [id]);
    const productsCount = parseInt(productsCheck.rows[0].count);
    
    // Проверяем, есть ли дочерние категории
    const childrenCheck = await pool.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [id]
    );
    const childrenCount = parseInt(childrenCheck.rows[0].count);
    
    // Если есть дочерние категории и не указан параметр with_children
    if (childrenCount > 0 && with_children !== 'true') {
      return res.status(400).json({ 
        error: 'Категория имеет подкатегории и не может быть удалена',
        childrenCount: childrenCount
      });
    }
    
    // Если указан параметр with_children, удаляем все дочерние категории рекурсивно
    if (with_children === 'true') {
      let totalDeletedChildren = 0;
      
      // Если есть дочерние категории, подсчитываем их (включая вложенные)
      if (childrenCount > 0) {
        const allChildren = await pool.query(
          `WITH RECURSIVE children AS (
            SELECT id FROM categories WHERE parent_id = $1
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN children ch ON c.parent_id = ch.id
          ) SELECT COUNT(*) as count FROM children`,
          [id]
        );
        totalDeletedChildren = parseInt(allChildren.rows[0].count);
      }
      
      // Очищаем привязки товаров для основной категории перед удалением
      if (categoryLevel === 0 && productsCount > 0) {
        // Для основной категории очищаем category_id, subcategory_id и subsubcategory_id
        await pool.query(
          'UPDATE products SET category_id = NULL, subcategory_id = NULL, subsubcategory_id = NULL WHERE category_id = $1',
          [id]
        );
      } else if (categoryLevel === 1 && productsCount > 0) {
        // Подкатегория - очищаем subcategory_id и subsubcategory_id
        await pool.query(
          'UPDATE products SET subcategory_id = NULL, subsubcategory_id = NULL WHERE subcategory_id = $1',
          [id]
        );
      } else if (categoryLevel === 2 && productsCount > 0) {
        // Под-подкатегория - очищаем subsubcategory_id
        await pool.query(
          'UPDATE products SET subsubcategory_id = NULL WHERE subsubcategory_id = $1',
          [id]
        );
      }
      
      // Удаляем категорию и все её дочерние категории рекурсивно
      await deleteCategoryRecursive(id, pool);
      
      // Проверяем, что категория была удалена
      const checkResult = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      if (checkResult.rows.length > 0) {
        return res.status(500).json({ error: 'Ошибка удаления категории' });
      }
      
      return res.json({ 
        message: `Категория "${categoryName}"${totalDeletedChildren > 0 ? ` и все её подкатегории (${totalDeletedChildren})` : ''} успешно удалена.${productsCount > 0 ? ` Привязки ${productsCount} товаров были автоматически очищены.` : ''}`, 
        category: categoryInfo.rows[0],
        deletedChildren: totalDeletedChildren
      });
    }
    
    // Если это подкатегория или под-подкатегория, автоматически очищаем привязки
    if (productsCount > 0) {
      if (categoryLevel === 1) {
        // Подкатегория - очищаем subcategory_id и subsubcategory_id
        await pool.query(
          'UPDATE products SET subcategory_id = NULL, subsubcategory_id = NULL WHERE subcategory_id = $1',
          [id]
        );
      } else if (categoryLevel === 2) {
        // Под-подкатегория - очищаем subsubcategory_id
        await pool.query(
          'UPDATE products SET subsubcategory_id = NULL WHERE subsubcategory_id = $1',
          [id]
        );
      } else {
        // Основная категория - не удаляем, нужно явно переносить товары
        // Получаем детальную информацию о привязках
        const detailsCheck = await pool.query(
          'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
          [id]
        );
        const directCount = parseInt(detailsCheck.rows[0].count);
        return res.status(400).json({ 
          error: `Категория используется в ${directCount} товарах (привязано через category_id) и не может быть удалена. Используйте функцию переноса товаров в админке.`,
          productsCount: directCount,
          categoryLevel: categoryLevel
        });
      }
    }
    
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json({ 
      message: productsCount > 0 
        ? `Категория удалена. Привязки ${productsCount} товаров были автоматически очищены.` 
        : 'Категория удалена', 
      category: result.rows[0] 
    });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

export default router;


