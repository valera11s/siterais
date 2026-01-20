// Утилита для удаления старых чатов и сообщений
// Удаляет чаты, в которых никто не писал за последние 17 дней

import { pool } from '../index.js';

export async function cleanupOldChats() {
  try {
    // Находим чаты, в которых последнее сообщение было более 17 дней назад
    const seventeenDaysAgo = new Date();
    seventeenDaysAgo.setDate(seventeenDaysAgo.getDate() - 17);

    // Получаем чаты с последним сообщением старше 17 дней
    const result = await pool.query(`
      SELECT DISTINCT c.id
      FROM chats c
      LEFT JOIN chat_messages cm ON c.id = cm.chat_id
      WHERE c.id IN (
        SELECT chat_id
        FROM chat_messages
        GROUP BY chat_id
        HAVING MAX(created_at) < $1
      )
      OR (
        -- Если в чате вообще нет сообщений и он старше 17 дней
        NOT EXISTS (
          SELECT 1 FROM chat_messages WHERE chat_id = c.id
        )
        AND c.created_at < $1
      )
    `, [seventeenDaysAgo]);

    const chatIds = result.rows.map(row => row.id);

    if (chatIds.length === 0) {
      console.log('✅ Нет старых чатов для удаления');
      return { deletedChats: 0, deletedMessages: 0 };
    }

    // Удаляем сообщения этих чатов (CASCADE удалит их автоматически, но для отчетности посчитаем)
    const messagesCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE chat_id = ANY($1)',
      [chatIds]
    );
    const messagesCount = parseInt(messagesCountResult.rows[0]?.count || 0);

    // Удаляем чаты (CASCADE автоматически удалит связанные сообщения)
    await pool.query(
      'DELETE FROM chats WHERE id = ANY($1)',
      [chatIds]
    );

    console.log(`🗑️  Удалено чатов: ${chatIds.length}, сообщений: ${messagesCount}`);

    return {
      deletedChats: chatIds.length,
      deletedMessages: messagesCount
    };
  } catch (error) {
    console.error('❌ Ошибка удаления старых чатов:', error);
    throw error;
  }
}

// Запускаем очистку каждые 24 часа
export function startCleanupScheduler() {
  // Запускаем сразу при старте
  cleanupOldChats().catch(console.error);

  // Затем каждые 24 часа
  setInterval(() => {
    cleanupOldChats().catch(console.error);
  }, 24 * 60 * 60 * 1000); // 24 часа в миллисекундах

  console.log('🔄 Планировщик очистки старых чатов запущен (каждые 24 часа)');
}
