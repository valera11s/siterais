import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'camerahub',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Определяем пути
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function increasePrices() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Начинаем увеличение цен на 5%...\n');

    // Получаем все товары
    const result = await client.query('SELECT id, name, price FROM products ORDER BY id');
    const products = result.rows;

    if (products.length === 0) {
      console.log('❌ Товары не найдены в базе данных');
      return;
    }

    console.log(`📦 Найдено товаров: ${products.length}\n`);

    let updated = 0;
    let errors = 0;
    const changes = [];

    // Начинаем транзакцию
    await client.query('BEGIN');

    for (const product of products) {
      try {
        const oldPrice = parseFloat(product.price) || 0;
        
        if (oldPrice <= 0) {
          console.log(`⚠️  Товар ID ${product.id} (${product.name}): цена ${oldPrice}, пропускаем`);
          continue;
        }

        // Увеличиваем цену на 5%
        const newPrice = Math.round(oldPrice * 1.05 * 100) / 100; // Округляем до 2 знаков после запятой

        // Обновляем цену в БД
        await client.query(
          'UPDATE products SET price = $1 WHERE id = $2',
          [newPrice, product.id]
        );

        updated++;
        changes.push({
          id: product.id,
          name: product.name,
          oldPrice: oldPrice.toFixed(2),
          newPrice: newPrice.toFixed(2),
          difference: (newPrice - oldPrice).toFixed(2)
        });

        // Показываем прогресс каждые 50 товаров
        if (updated % 50 === 0) {
          console.log(`✅ Обработано: ${updated} товаров...`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Ошибка при обновлении товара ID ${product.id}:`, error.message);
      }
    }

    // Коммитим транзакцию
    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('📊 РЕЗУЛЬТАТЫ:');
    console.log('='.repeat(60));
    console.log(`✅ Успешно обновлено: ${updated} товаров`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`📦 Всего товаров: ${products.length}\n`);

    // Показываем примеры изменений (первые 10)
    if (changes.length > 0) {
      console.log('📋 Примеры изменений (первые 10):');
      console.log('-'.repeat(60));
      changes.slice(0, 10).forEach((change, index) => {
        console.log(`${index + 1}. ID ${change.id}: ${change.name}`);
        console.log(`   Старая цена: ${change.oldPrice} ₽ → Новая цена: ${change.newPrice} ₽ (+${change.difference} ₽)`);
      });
      if (changes.length > 10) {
        console.log(`\n... и еще ${changes.length - 10} товаров`);
      }
    }

    // Подсчитываем общую статистику
    const totalOldPrice = changes.reduce((sum, c) => sum + parseFloat(c.oldPrice), 0);
    const totalNewPrice = changes.reduce((sum, c) => sum + parseFloat(c.newPrice), 0);
    const totalIncrease = totalNewPrice - totalOldPrice;

    console.log('\n' + '='.repeat(60));
    console.log('💰 ОБЩАЯ СТАТИСТИКА:');
    console.log('='.repeat(60));
    console.log(`Общая стоимость до изменения: ${totalOldPrice.toFixed(2)} ₽`);
    console.log(`Общая стоимость после изменения: ${totalNewPrice.toFixed(2)} ₽`);
    console.log(`Общее увеличение: +${totalIncrease.toFixed(2)} ₽ (+5%)`);
    console.log('='.repeat(60));

    console.log('\n✅ Увеличение цен завершено успешно!');

  } catch (error) {
    // Откатываем транзакцию в случае ошибки
    await client.query('ROLLBACK');
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Запускаем скрипт
increasePrices()
  .then(() => {
    console.log('\n✅ Скрипт завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Скрипт завершен с ошибкой:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });

