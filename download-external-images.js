import pg from 'pg';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'camerahub',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Путь к папке uploads
const uploadsDir = path.join(__dirname, 'uploads');

// Создаем папку uploads, если её нет
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Создана папка uploads');
}

// Функция для скачивания изображения
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Редирект
        return downloadImage(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return reject(new Error(`Неверный тип файла: ${contentType}`));
      }

      // Определяем расширение файла
      const ext = getExtensionFromContentType(contentType) || getExtensionFromUrl(url) || '.jpg';
      
      // Генерируем уникальное имя файла (как в upload.js)
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `downloaded-${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      
      const fileStream = fs.createWriteStream(filepath);
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        const localPath = `/uploads/${filename}`;
        console.log(`✅ Скачано: ${url} -> ${localPath}`);
        resolve(localPath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Удаляем файл при ошибке
        reject(err);
      });
    }).on('error', reject);
  });
}

// Функция для определения расширения из Content-Type
function getExtensionFromContentType(contentType) {
  const mimeTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  return mimeTypes[contentType.toLowerCase()];
}

// Функция для определения расширения из URL
function getExtensionFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
    if (match) {
      return '.' + match[1];
    }
  } catch (e) {
    // Игнорируем ошибки парсинга URL
  }
  return null;
}

// Функция для проверки, является ли URL внешним
function isExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

// Функция для проверки, является ли URL локальным
function isLocalPath(url) {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('/uploads/') || url.startsWith('uploads/');
}

// Задержка между запросами (чтобы не перегружать серверы)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Начинаем обработку товаров...\n');
    
    // Получаем все товары
    const result = await client.query('SELECT id, name, image_url, images FROM products');
    const products = result.rows;
    
    console.log(`📦 Найдено товаров: ${products.length}\n`);
    
    let totalProcessed = 0;
    let totalDownloaded = 0;
    let totalErrors = 0;
    let totalSkipped = 0;
    let totalUpdated = 0;
    
    for (const product of products) {
      try {
        console.log(`\n📋 Товар ID ${product.id}: ${product.name}`);
        let hasChanges = false;
        let newImageUrl = product.image_url;
        let newImages = product.images || [];
        
        // Обрабатываем основное изображение
        if (isExternalUrl(product.image_url)) {
          console.log(`  🔄 Обработка основного изображения: ${product.image_url}`);
          try {
            newImageUrl = await downloadImage(product.image_url);
            hasChanges = true;
            totalDownloaded++;
            await delay(500); // Задержка 500ms между скачиваниями
          } catch (error) {
            console.error(`  ❌ Ошибка скачивания основного изображения: ${error.message}`);
            totalErrors++;
            // Оставляем старое значение, но продолжаем обработку товара
            newImageUrl = product.image_url;
          }
        } else if (isLocalPath(product.image_url)) {
          console.log(`  ⏭️  Основное изображение уже локальное: ${product.image_url}`);
          totalSkipped++;
        } else if (product.image_url) {
          console.log(`  ⚠️  Неизвестный формат основного изображения: ${product.image_url}`);
        }
        
        // Обрабатываем массив дополнительных изображений
        if (Array.isArray(product.images) && product.images.length > 0) {
          const newImagesArray = [];
          
          for (const imgUrl of product.images) {
            if (isExternalUrl(imgUrl)) {
              console.log(`  🔄 Обработка дополнительного изображения: ${imgUrl}`);
              try {
                const localPath = await downloadImage(imgUrl);
                newImagesArray.push(localPath);
                hasChanges = true;
                totalDownloaded++;
                await delay(500); // Задержка 500ms между скачиваниями
              } catch (error) {
                console.error(`  ❌ Ошибка скачивания дополнительного изображения: ${error.message}`);
                totalErrors++;
                // Пропускаем это изображение
              }
            } else if (isLocalPath(imgUrl)) {
              console.log(`  ⏭️  Дополнительное изображение уже локальное: ${imgUrl}`);
              newImagesArray.push(imgUrl);
              totalSkipped++;
            } else if (imgUrl) {
              console.log(`  ⚠️  Неизвестный формат дополнительного изображения: ${imgUrl}`);
              newImagesArray.push(imgUrl);
            }
          }
          
          newImages = newImagesArray;
        }
        
        // Обновляем запись в БД, если были изменения
        if (hasChanges) {
          await client.query(
            'UPDATE products SET image_url = $1, images = $2 WHERE id = $3',
            [newImageUrl, newImages.length > 0 ? newImages : null, product.id]
          );
          console.log(`  ✅ Товар обновлен в БД`);
          totalUpdated++;
        } else {
          console.log(`  ℹ️  Изменений не требуется`);
        }
        
        totalProcessed++;
        
      } catch (error) {
        console.error(`  ❌ Ошибка обработки товара ID ${product.id}: ${error.message}`);
        totalErrors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 ИТОГИ:');
    console.log(`  Всего товаров обработано: ${totalProcessed}`);
    console.log(`  Изображений скачано: ${totalDownloaded}`);
    console.log(`  Изображений пропущено (уже локальные): ${totalSkipped}`);
    console.log(`  Товаров обновлено в БД: ${totalUpdated}`);
    console.log(`  Ошибок: ${totalErrors}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Запуск скрипта
processProducts()
  .then(() => {
    console.log('\n✅ Скрипт завершен успешно');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Скрипт завершен с ошибкой:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
