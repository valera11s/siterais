import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env файл из корня проекта (на уровень выше server/)
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Отладочный вывод (можно убрать после проверки)
console.log('📁 .env путь:', envPath);
console.log('📋 TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ установлен' : '❌ не установлен');
console.log('📋 TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID ? '✅ установлен' : '❌ не установлен');

import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import categoriesRoutes from './routes/categories.js';
import brandsRoutes from './routes/brands.js';
import settingsRoutes from './routes/settings.js';
import messagesRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import chatsRoutes from './routes/chats.js';
import blockedIPsRoutes from './routes/blocked-ips.js';
import { ddosProtection } from './utils/ddos-protection.js';
import { startCleanupScheduler } from './utils/cleanup-old-chats.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Trust proxy для правильного определения IP клиента (важно для получения реального IP через прокси/CDN)
app.set('trust proxy', true);

// Защита от DDoS (применяется ко всем маршрутам)
app.use(ddosProtection);

// Middleware для явной установки UTF-8 в заголовках всех JSON ответов
app.use((req, res, next) => {
  // Устанавливаем UTF-8 только для JSON ответов, не трогая другие типы
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статических файлов из папки uploads
// (path и fileURLToPath уже импортированы выше)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Подключение к PostgreSQL
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'camerahub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  client_encoding: 'UTF8', // Явно указываем кодировку клиента
});

// Проверка подключения
pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к PostgreSQL:', err);
});

// Routes
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/blocked-ips', blockedIPsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  // Запускаем планировщик очистки старых чатов
  startCleanupScheduler();
});


