/**
 * Скрипт для нагрузочного тестирования сервера
 * Симулирует 100 запросов в секунду
 */

import http from 'http';
import https from 'https';

// Настройки тестирования
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:3001';
const REQUESTS_PER_SECOND = parseInt(process.env.RPS || '100');
const TEST_DURATION_SECONDS = parseInt(process.env.DURATION || '10');
const ENDPOINT = process.env.ENDPOINT || '/api/products';

// Статистика
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  blocked: 0,
  statusCodes: {},
  responseTimes: [],
  startTime: null,
  endTime: null,
};

// Функция для выполнения HTTP запроса
function makeRequest(url, endpoint) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const fullUrl = `${url}${endpoint}`;
    const urlObj = new URL(fullUrl);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'LoadTest/1.0',
      },
    };

    const req = protocol.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        stats.responseTimes.push(responseTime);
        const statusCode = res.statusCode;
        
        if (!stats.statusCodes[statusCode]) {
          stats.statusCodes[statusCode] = 0;
        }
        stats.statusCodes[statusCode]++;

        if (statusCode >= 200 && statusCode < 300) {
          stats.success++;
          resolve({ statusCode, responseTime });
        } else if (statusCode === 403 || statusCode === 429) {
          stats.blocked++;
          resolve({ statusCode, responseTime, blocked: true });
        } else {
          stats.errors++;
          resolve({ statusCode, responseTime, error: true });
        }
      });
    });

    req.on('error', (error) => {
      stats.errors++;
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      stats.errors++;
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Функция для выполнения батча запросов
async function runBatch() {
  const promises = [];
  for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
    promises.push(
      makeRequest(TARGET_URL, ENDPOINT).catch((error) => {
        stats.errors++;
        return { error: error.message };
      })
    );
  }
  await Promise.all(promises);
  stats.total += REQUESTS_PER_SECOND;
}

// Вычисление статистики
function calculateStats() {
  const responseTimes = stats.responseTimes;
  if (responseTimes.length === 0) return null;

  responseTimes.sort((a, b) => a - b);
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const min = responseTimes[0];
  const max = responseTimes[responseTimes.length - 1];
  const median = responseTimes[Math.floor(responseTimes.length / 2)];
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

  return {
    avg: Math.round(avg),
    min,
    max,
    median,
    p95,
    p99,
  };
}

// Вывод статистики
function printStats() {
  const duration = (stats.endTime - stats.startTime) / 1000;
  const actualRPS = Math.round(stats.total / duration);
  const timeStats = calculateStats();

  console.log('\n' + '='.repeat(70));
  console.log('📊 РЕЗУЛЬТАТЫ НАГРУЗОЧНОГО ТЕСТИРОВАНИЯ');
  console.log('='.repeat(70));
  console.log(`🎯 Целевой URL: ${TARGET_URL}${ENDPOINT}`);
  console.log(`⚙️  Настройки: ${REQUESTS_PER_SECOND} RPS в течение ${TEST_DURATION_SECONDS} секунд`);
  console.log(`⏱️  Длительность теста: ${duration.toFixed(2)} секунд`);
  console.log(`\n📈 ОБЩАЯ СТАТИСТИКА:`);
  console.log(`   Всего запросов: ${stats.total}`);
  console.log(`   Фактический RPS: ${actualRPS}`);
  console.log(`   ✅ Успешных: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Ошибок: ${stats.errors} (${((stats.errors / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   🚫 Заблокировано: ${stats.blocked} (${((stats.blocked / stats.total) * 100).toFixed(1)}%)`);

  console.log(`\n📊 КОДЫ СТАТУСА:`);
  Object.entries(stats.statusCodes)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .forEach(([code, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`   ${code}: ${count} (${percentage}%)`);
    });

  if (timeStats) {
    console.log(`\n⏱️  ВРЕМЯ ОТВЕТА (мс):`);
    console.log(`   Среднее: ${timeStats.avg} мс`);
    console.log(`   Медиана: ${timeStats.median} мс`);
    console.log(`   Минимум: ${timeStats.min} мс`);
    console.log(`   Максимум: ${timeStats.max} мс`);
    console.log(`   95-й перцентиль: ${timeStats.p95} мс`);
    console.log(`   99-й перцентиль: ${timeStats.p99} мс`);
  }

  console.log('\n' + '='.repeat(70));
  
  // Оценка производительности
  if (stats.success / stats.total >= 0.95 && timeStats && timeStats.avg < 500) {
    console.log('✅ Сервер отлично справляется с нагрузкой!');
  } else if (stats.success / stats.total >= 0.8 && timeStats && timeStats.avg < 1000) {
    console.log('⚠️  Сервер справляется, но есть задержки');
  } else {
    console.log('❌ Сервер испытывает проблемы с нагрузкой');
  }
  console.log('='.repeat(70) + '\n');
}

// Основная функция тестирования
async function runLoadTest() {
  console.log('🚀 Запуск нагрузочного тестирования...\n');
  console.log(`🎯 Цель: ${TARGET_URL}${ENDPOINT}`);
  console.log(`⚙️  Нагрузка: ${REQUESTS_PER_SECOND} запросов/секунду`);
  console.log(`⏱️  Длительность: ${TEST_DURATION_SECONDS} секунд\n`);
  console.log('📊 Начинаем тест...\n');

  stats.startTime = Date.now();
  const interval = setInterval(async () => {
    await runBatch();
  }, 1000); // Каждую секунду

  // Останавливаем тест через заданное время
  setTimeout(() => {
    clearInterval(interval);
    stats.endTime = Date.now();
    
    // Ждем завершения всех запросов
    setTimeout(() => {
      printStats();
      process.exit(0);
    }, 2000);
  }, TEST_DURATION_SECONDS * 1000);
}

// Обработка сигналов для корректного завершения
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Тест прерван пользователем');
  stats.endTime = Date.now();
  printStats();
  process.exit(0);
});

// Запуск теста
runLoadTest().catch((error) => {
  console.error('❌ Ошибка при выполнении теста:', error);
  process.exit(1);
});
