import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env файл
dotenv.config({ path: resolve(__dirname, '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'camerahub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function setAllRatingsTo5() {
  try {
    console.log('🔄 Устанавливаю рейтинг 5.00 для всех товаров...');

    const result = await pool.query(`
      UPDATE products
      SET rating = 5.00
      WHERE rating IS NULL OR rating != 5.00
      RETURNING id, name, rating
    `);

    console.log(`✅ Обновлено товаров: ${result.rowCount}`);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Примеры обновленных товаров:');
      result.rows.slice(0, 5).forEach((product) => {
        console.log(`  - ID: ${product.id}, Название: ${product.name}, Рейтинг: ${product.rating}`);
      });
      if (result.rows.length > 5) {
        console.log(`  ... и еще ${result.rows.length - 5} товаров`);
      }
    }

    // Проверяем итоговое количество товаров с рейтингом 5.00
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count FROM products WHERE rating = 5.00
    `);
    
    console.log(`\n✅ Итого товаров с рейтингом 5.00: ${checkResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении рейтингов:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

setAllRatingsTo5()
  .then(() => {
    console.log('\n✅ Готово!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Ошибка:', error);
    process.exit(1);
  });
