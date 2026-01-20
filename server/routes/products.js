import express from 'express';
import { pool } from '../index.js';
import { validateSearchQuery, validateString } from '../utils/validation.js';

const router = express.Router();

// Функция генерации slug из названия
function generateSlugFromName(name) {
  if (!name) return '';
  const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const en = 'abvgdeezhziyklmnoprstufkhchshschiyeyuya';
  return name
    .toLowerCase()
    .split('')
    .map(char => {
      const idx = ru.indexOf(char);
      return idx >= 0 ? en[idx] : char;
    })
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Получить уникальные бренды из товаров
router.get('/brands', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT brand 
      FROM products 
      WHERE brand IS NOT NULL AND brand != '' 
      ORDER BY brand
    `);
    const brands = result.rows.map(row => row.brand).filter(Boolean);
    res.json(brands);
  } catch (error) {
    console.error('Ошибка получения брендов из товаров:', error);
    res.status(500).json({ error: 'Ошибка получения брендов' });
  }
});

// Получить все товары
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, subsubcategory, brand, featured, search } = req.query;
    
    // Валидация поискового запроса
    if (search) {
      const searchValidation = validateSearchQuery(search);
      if (!searchValidation.valid) {
        return res.status(400).json({ error: searchValidation.error });
      }
    }
    
    // Валидация категорий, подкатегорий и брендов
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      for (const cat of categories) {
        if (typeof cat === 'string' && !/^\d+$/.test(cat)) {
          const validation = validateString(cat, 'Категория', 0, 255, false);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }
    }
    
    if (subcategory) {
      const subcategories = Array.isArray(subcategory) ? subcategory : [subcategory];
      for (const subcat of subcategories) {
        if (typeof subcat === 'string' && !/^\d+$/.test(subcat)) {
          const validation = validateString(subcat, 'Подкатегория', 0, 255, false);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }
    }
    
    if (subsubcategory) {
      const subsubcategories = Array.isArray(subsubcategory) ? subsubcategory : [subsubcategory];
      for (const subsubcat of subsubcategories) {
        if (typeof subsubcat === 'string' && !/^\d+$/.test(subsubcat)) {
          const validation = validateString(subsubcat, 'Под-подкатегория', 0, 255, false);
          if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
          }
        }
      }
    }
    
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      for (const brandName of brands) {
        const validation = validateString(brandName, 'Бренд', 0, 100, false);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
      }
    }
    
    // Запрос с JOIN для получения названий категорий и префиксов (включая вторую категорию)
    let query = `
      SELECT 
        p.*,
        c1.name as category_name,
        c1.product_name_prefix as category_product_name_prefix,
        c2.name as subcategory_name,
        c2.product_name_prefix as subcategory_product_name_prefix,
        c3.name as subsubcategory_name,
        c3.product_name_prefix as subsubcategory_product_name_prefix,
        c4.name as category_name_2,
        c4.product_name_prefix as category_product_name_prefix_2
      FROM products p
      LEFT JOIN categories c1 ON p.category_id = c1.id
      LEFT JOIN categories c2 ON p.subcategory_id = c2.id
      LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
      LEFT JOIN categories c4 ON p.category_id_2 = c4.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Поддержка множественного выбора категорий (массив ID или названий)
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      // Проверяем, являются ли значения числами (ID) или строками (названия)
      const categoryIds = [];
      const categoryNames = [];
      categories.forEach(cat => {
        if (/^\d+$/.test(cat)) {
          categoryIds.push(parseInt(cat));
        } else {
          categoryNames.push(cat);
        }
      });
      
      if (categoryIds.length > 0 && categoryNames.length > 0) {
        query += ` AND ((p.category_id = ANY($${paramCount++}::int[]) OR c1.name = ANY($${paramCount++}::text[])) OR (p.category_id_2 = ANY($${paramCount++}::int[]) OR c4.name = ANY($${paramCount++}::text[])))`;
        params.push(categoryIds, categoryNames, categoryIds, categoryNames);
      } else if (categoryIds.length > 0) {
        query += ` AND (p.category_id = ANY($${paramCount++}::int[]) OR p.category_id_2 = ANY($${paramCount++}::int[]))`;
        params.push(categoryIds, categoryIds);
      } else if (categoryNames.length > 0) {
        query += ` AND (c1.name = ANY($${paramCount++}::text[]) OR c4.name = ANY($${paramCount++}::text[]))`;
        params.push(categoryNames, categoryNames);
      }
    }
    
    // Поддержка множественного выбора подкатегорий
    if (subcategory) {
      const subcategories = Array.isArray(subcategory) ? subcategory : [subcategory];
      const subcategoryIds = [];
      const subcategoryNames = [];
      subcategories.forEach(subcat => {
        if (/^\d+$/.test(subcat)) {
          subcategoryIds.push(parseInt(subcat));
        } else {
          subcategoryNames.push(subcat);
        }
      });
      
      if (subcategoryIds.length > 0 && subcategoryNames.length > 0) {
        query += ` AND (p.subcategory_id = ANY($${paramCount++}::int[]) OR c2.name = ANY($${paramCount++}::text[]))`;
        params.push(subcategoryIds, subcategoryNames);
      } else if (subcategoryIds.length > 0) {
        query += ` AND p.subcategory_id = ANY($${paramCount++}::int[])`;
        params.push(subcategoryIds);
      } else if (subcategoryNames.length > 0) {
        query += ` AND c2.name = ANY($${paramCount++}::text[])`;
        params.push(subcategoryNames);
      }
    }
    
    // Поддержка множественного выбора под-подкатегорий
    if (subsubcategory) {
      const subsubcategories = Array.isArray(subsubcategory) ? subsubcategory : [subsubcategory];
      const subsubcategoryIds = [];
      const subsubcategoryNames = [];
      subsubcategories.forEach(subsubcat => {
        if (/^\d+$/.test(subsubcat)) {
          subsubcategoryIds.push(parseInt(subsubcat));
        } else {
          subsubcategoryNames.push(subsubcat);
        }
      });
      
      if (subsubcategoryIds.length > 0 && subsubcategoryNames.length > 0) {
        query += ` AND (p.subsubcategory_id = ANY($${paramCount++}::int[]) OR c3.name = ANY($${paramCount++}::text[]))`;
        params.push(subsubcategoryIds, subsubcategoryNames);
      } else if (subsubcategoryIds.length > 0) {
        query += ` AND p.subsubcategory_id = ANY($${paramCount++}::int[])`;
        params.push(subsubcategoryIds);
      } else if (subsubcategoryNames.length > 0) {
        query += ` AND c3.name = ANY($${paramCount++}::text[])`;
        params.push(subsubcategoryNames);
      }
    }
    
    // Поддержка множественного выбора брендов
    if (brand) {
      const brands = Array.isArray(brand) ? brand : [brand];
      query += ` AND p.brand = ANY($${paramCount++}::text[])`;
      params.push(brands);
    }
    
    if (featured === 'true') {
      query += ` AND p.featured = true`;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({ error: 'Ошибка получения товаров' });
  }
});

// Получить товар по ID или slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Валидация identifier
    if (!identifier) {
      return res.status(400).json({ error: 'Идентификатор товара обязателен' });
    }
    
    const identifierValidation = validateString(identifier, 'Идентификатор', 1, 255, false);
    if (!identifierValidation.valid) {
      return res.status(400).json({ error: identifierValidation.error });
    }
    
    // Проверяем, является ли identifier числом (ID) или строкой (slug)
    const isNumeric = /^\d+$/.test(identifier);
    
    let query;
    let params;
    
    if (isNumeric) {
      // Поиск по ID
      query = `
        SELECT 
          p.*,
          c1.name as category_name,
          c1.product_name_prefix as category_product_name_prefix,
          c2.name as subcategory_name,
          c2.product_name_prefix as subcategory_product_name_prefix,
          c3.name as subsubcategory_name,
          c3.product_name_prefix as subsubcategory_product_name_prefix,
          c4.name as category_name_2,
          c4.product_name_prefix as category_product_name_prefix_2
        FROM products p
        LEFT JOIN categories c1 ON p.category_id = c1.id
        LEFT JOIN categories c2 ON p.subcategory_id = c2.id
        LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
        LEFT JOIN categories c4 ON p.category_id_2 = c4.id
        WHERE p.id = $1
      `;
      params = [identifier];
    } else {
      // Поиск по slug (может быть в формате slug-id)
      // Извлекаем ID из конца строки (если есть)
      const parts = identifier.split('-');
      const lastPart = parts[parts.length - 1];
      const possibleId = /^\d+$/.test(lastPart) ? lastPart : null;
      
      // Ищем по slug или по ID (если slug в формате slug-id или если slug не найден)
      query = `
        SELECT 
          p.*,
          c1.name as category_name,
          c1.product_name_prefix as category_product_name_prefix,
          c2.name as subcategory_name,
          c2.product_name_prefix as subcategory_product_name_prefix,
          c3.name as subsubcategory_name,
          c3.product_name_prefix as subsubcategory_product_name_prefix,
          c4.name as category_name_2,
          c4.product_name_prefix as category_product_name_prefix_2
        FROM products p
        LEFT JOIN categories c1 ON p.category_id = c1.id
        LEFT JOIN categories c2 ON p.subcategory_id = c2.id
        LEFT JOIN categories c3 ON p.subsubcategory_id = c3.id
        LEFT JOIN categories c4 ON p.category_id_2 = c4.id
        WHERE (p.slug = $1 ${possibleId ? 'OR p.id = $2' : ''})
        ORDER BY CASE WHEN p.slug = $1 THEN 1 ${possibleId ? 'WHEN p.id = $2 THEN 2' : ''} ELSE 3 END
        LIMIT 1
      `;
      params = possibleId ? [identifier, parseInt(possibleId)] : [identifier];
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка получения товара' });
  }
});

// Создать товар
router.post('/', async (req, res) => {
  try {
    const {
      name, description, price, original_price, image_url, images,
      category_id, subcategory_id, subsubcategory_id,
      category_name, subcategory_name, subsubcategory_name, // Новые поля с названиями
      category_id_2, category_name_2, // Вторая глобальная категория
      brand, in_stock, featured, condition, rating, specs
    } = req.body;

    // Если переданы названия категорий, но не ID - находим или создаем категории
    let finalCategoryId = category_id || null;
    let finalSubcategoryId = subcategory_id || null;
    let finalSubsubcategoryId = subsubcategory_id || null;
    let finalCategoryId2 = category_id_2 || null;

    // Находим или создаем категорию по названию
    if (category_name && !finalCategoryId) {
      const catResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name]
      );
      if (catResult.rows.length > 0) {
        finalCategoryId = catResult.rows[0].id;
      } else {
        // Создаем категорию
        const newCatResult = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name]
        );
        finalCategoryId = newCatResult.rows[0].id;
      }
    }

    // Находим или создаем подкатегорию
    if (subcategory_name && finalCategoryId && !finalSubcategoryId) {
      const subcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subcategory_name, finalCategoryId]
      );
      if (subcatResult.rows.length > 0) {
        finalSubcategoryId = subcatResult.rows[0].id;
      } else {
        const newSubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 1) RETURNING id',
          [subcategory_name, finalCategoryId]
        );
        finalSubcategoryId = newSubcatResult.rows[0].id;
      }
    }

    // Находим или создаем под-подкатегорию
    if (subsubcategory_name && finalSubcategoryId && !finalSubsubcategoryId) {
      const subsubcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subsubcategory_name, finalSubcategoryId]
      );
      if (subsubcatResult.rows.length > 0) {
        finalSubsubcategoryId = subsubcatResult.rows[0].id;
      } else {
        const newSubsubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 2) RETURNING id',
          [subsubcategory_name, finalSubcategoryId]
        );
        finalSubsubcategoryId = newSubsubcatResult.rows[0].id;
      }
    }

    // Находим или создаем вторую глобальную категорию по названию
    if (category_name_2 && !finalCategoryId2) {
      const cat2Result = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name_2]
      );
      if (cat2Result.rows.length > 0) {
        finalCategoryId2 = cat2Result.rows[0].id;
      } else {
        // Создаем категорию
        const newCat2Result = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name_2]
        );
        finalCategoryId2 = newCat2Result.rows[0].id;
      }
    }

    // Генерируем slug из названия товара
    let productSlug = req.body.slug;
    if (!productSlug && name) {
      // Простая транслитерация и создание slug
      productSlug = name
        .toLowerCase()
        .replace(/[а-яё]/g, (char) => {
          const ru = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
          const en = 'abvgdeezhziyklmnoprstufkhchshschiyeyuya';
          return en[ru.indexOf(char)] || char;
        })
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Нормализуем числовые поля: пустые строки -> null
    const normalizedPrice = (price === '' || price === null || price === undefined) ? null : parseFloat(price);
    const normalizedOriginalPrice = (original_price === '' || original_price === null || original_price === undefined) ? null : parseFloat(original_price);
    const normalizedRating = (rating === '' || rating === null || rating === undefined) ? null : parseFloat(rating);

    const result = await pool.query(
      `INSERT INTO products (
        name, description, price, original_price, image_url, images,
        category_id, subcategory_id, subsubcategory_id, category_id_2, brand,
        in_stock, featured, popular, on_sale, condition, rating, specs, slug
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        name, description, normalizedPrice, normalizedOriginalPrice, image_url, images || [],
        finalCategoryId, finalSubcategoryId, finalSubsubcategoryId, finalCategoryId2, brand,
        in_stock ?? true, featured ?? false, popular ?? false, on_sale ?? false, 
        condition || 'new', normalizedRating, JSON.stringify(specs || {}), productSlug || null
      ]
    );

    // Если slug не был создан, обновим его после получения ID
    let finalProduct = result.rows[0];
    if (!finalProduct.slug && finalProduct.name) {
      const generatedSlug = `${productSlug || generateSlugFromName(finalProduct.name)}-${finalProduct.id}`;
      const updateResult = await pool.query(
        'UPDATE products SET slug = $1 WHERE id = $2 RETURNING *',
        [generatedSlug, finalProduct.id]
      );
      finalProduct = updateResult.rows[0];
    }

    res.status(201).json(finalProduct);
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({ error: 'Ошибка создания товара' });
  }
});

// Обновить товар
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, price, original_price, image_url, images,
      category_id, subcategory_id, subsubcategory_id,
      category_name, subcategory_name, subsubcategory_name, // Новые поля с названиями
      category_id_2, category_name_2, // Вторая глобальная категория
      brand, in_stock, featured, popular, on_sale, condition, rating, specs
    } = req.body;

    // Если переданы названия категорий, но не ID - находим или создаем категории
    let finalCategoryId = category_id || null;
    let finalSubcategoryId = subcategory_id || null;
    let finalSubsubcategoryId = subsubcategory_id || null;
    let finalCategoryId2 = category_id_2 || null;

    // Находим или создаем категорию по названию
    if (category_name && !finalCategoryId) {
      const catResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name]
      );
      if (catResult.rows.length > 0) {
        finalCategoryId = catResult.rows[0].id;
      } else {
        const newCatResult = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name]
        );
        finalCategoryId = newCatResult.rows[0].id;
      }
    }

    // Находим или создаем подкатегорию
    if (subcategory_name && finalCategoryId && !finalSubcategoryId) {
      const subcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subcategory_name, finalCategoryId]
      );
      if (subcatResult.rows.length > 0) {
        finalSubcategoryId = subcatResult.rows[0].id;
      } else {
        const newSubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 1) RETURNING id',
          [subcategory_name, finalCategoryId]
        );
        finalSubcategoryId = newSubcatResult.rows[0].id;
      }
    }

    // Находим или создаем под-подкатегорию
    if (subsubcategory_name && finalSubcategoryId && !finalSubsubcategoryId) {
      const subsubcatResult = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id = $2 LIMIT 1',
        [subsubcategory_name, finalSubcategoryId]
      );
      if (subsubcatResult.rows.length > 0) {
        finalSubsubcategoryId = subsubcatResult.rows[0].id;
      } else {
        const newSubsubcatResult = await pool.query(
          'INSERT INTO categories (name, parent_id, level) VALUES ($1, $2, 2) RETURNING id',
          [subsubcategory_name, finalSubcategoryId]
        );
        finalSubsubcategoryId = newSubsubcatResult.rows[0].id;
      }
    }

    // Находим или создаем вторую глобальную категорию по названию
    if (category_name_2 && !finalCategoryId2) {
      const cat2Result = await pool.query(
        'SELECT id FROM categories WHERE name = $1 AND parent_id IS NULL LIMIT 1',
        [category_name_2]
      );
      if (cat2Result.rows.length > 0) {
        finalCategoryId2 = cat2Result.rows[0].id;
      } else {
        // Создаем категорию
        const newCat2Result = await pool.query(
          'INSERT INTO categories (name, level) VALUES ($1, 0) RETURNING id',
          [category_name_2]
        );
        finalCategoryId2 = newCat2Result.rows[0].id;
      }
    }

    // Проверяем, изменилось ли название и нужно ли обновить slug
    let productSlug = req.body.slug;
    const currentProduct = await pool.query('SELECT name, slug FROM products WHERE id = $1', [id]);
    
    if (currentProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Если название изменилось и slug не передан явно, генерируем новый slug
    if (!productSlug && name && name !== currentProduct.rows[0].name) {
      productSlug = `${generateSlugFromName(name)}-${id}`;
    } else if (!productSlug && !currentProduct.rows[0].slug) {
      // Если slug нет совсем, создаем его
      productSlug = `${generateSlugFromName(name || currentProduct.rows[0].name)}-${id}`;
    } else {
      productSlug = productSlug || currentProduct.rows[0].slug;
    }

    // Нормализуем числовые поля: пустые строки -> null
    const normalizedPrice = (price === '' || price === null || price === undefined) ? null : parseFloat(price);
    const normalizedOriginalPrice = (original_price === '' || original_price === null || original_price === undefined) ? null : parseFloat(original_price);
    const normalizedRating = (rating === '' || rating === null || rating === undefined) ? null : parseFloat(rating);

    const result = await pool.query(
      `UPDATE products SET
        name = $1, description = $2, price = $3, original_price = $4,
        image_url = $5, images = $6, category_id = $7, subcategory_id = $8,
        subsubcategory_id = $9, category_id_2 = $10, brand = $11, in_stock = $12,
        featured = $13, popular = $14, on_sale = $15, condition = $16, rating = $17, specs = $18, slug = $19
      WHERE id = $20
      RETURNING *`,
      [
        name, description, normalizedPrice, normalizedOriginalPrice, image_url, images || [],
        finalCategoryId, finalSubcategoryId, finalSubsubcategoryId, finalCategoryId2, brand,
        in_stock, featured, popular ?? false, on_sale ?? false, 
        condition || 'new', normalizedRating, JSON.stringify(specs || {}), productSlug, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({ error: 'Ошибка обновления товара' });
  }
});

// Удалить товар
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    res.json({ message: 'Товар удален', id: result.rows[0].id });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({ error: 'Ошибка удаления товара' });
  }
});

export default router;

