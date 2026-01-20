import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'camerahub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function restoreCategory() {
  try {
    console.log('🔍 Проверка категории "Видеокамеры"...\n');

    // Проверяем, существует ли категория
    const checkResult = await pool.query(
      "SELECT id FROM categories WHERE name = 'Видеокамеры'"
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Категория "Видеокамеры" уже существует (ID: ${checkResult.rows[0].id})`);
      await pool.end();
      return;
    }

    // Создаем категорию
    console.log('📝 Создание категории "Видеокамеры"...');
    const result = await pool.query(
      "INSERT INTO categories (name, parent_id, level) VALUES ('Видеокамеры', NULL, 0) RETURNING id, name"
    );

    const categoryId = result.rows[0].id;
    console.log(`✅ Категория "Видеокамеры" создана (ID: ${categoryId})\n`);

    // Проверяем товары без категории, которые могут быть видеокамерами
    console.log('🔍 Поиск товаров без категории, похожих на видеокамеры...');
    const productsResult = await pool.query(`
      SELECT id, name 
      FROM products 
      WHERE category_id IS NULL 
        AND (name ILIKE '%видеокамер%' OR name ILIKE '%video%')
    `);

    if (productsResult.rows.length > 0) {
      console.log(`\n📦 Найдено ${productsResult.rows.length} товаров без категории:`);
      productsResult.rows.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`);
      });

      // Привязываем товары к категории
      const updateResult = await pool.query(
        `UPDATE products SET category_id = $1 WHERE category_id IS NULL AND (name ILIKE '%видеокамер%' OR name ILIKE '%video%') RETURNING id`,
        [categoryId]
      );
      console.log(`\n✅ Привязано ${updateResult.rows.length} товаров к категории "Видеокамеры"`);
    } else {
      console.log('ℹ️  Товары без категории не найдены');
    }

    console.log('\n✅ Восстановление завершено!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

restoreCategory();

